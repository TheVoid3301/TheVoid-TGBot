import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";
import { SocksProxyAgent } from "socks-proxy-agent";

import Middleware from "./src/core/middleware.js";
import JobQueue from "./src/core/job-queue.js";
import RateLimiter from "./src/core/rate-limiter.js";
import { createContext } from "./src/core/context.js";
import loggerMiddleware from "./src/core/logger.js";
import { createRouter } from "./src/handlers/router.js";

// ── 配置 ──────────────────────────────────────────────
const token = process.env.BOT_TOKEN;
const proxyUrl = process.env.HTTPS_PROXY;
const baseApiUrl = process.env.TG_API_URL;

if (!token) {
  console.error("请在 .env 文件里设置 BOT_TOKEN");
  process.exit(1);
}

// ── Bot 初始化 ─────────────────────────────────────────
const botOptions = { polling: true };

if (baseApiUrl) {
  botOptions.baseApiUrl = baseApiUrl;
}

if (proxyUrl) {
  delete process.env.HTTPS_PROXY;
  delete process.env.HTTP_PROXY;
  delete process.env.https_proxy;
  delete process.env.http_proxy;
  delete process.env.NO_PROXY;
  delete process.env.no_proxy;

  const socksUrl = proxyUrl.replace(/^http:/, "socks:");
  botOptions.request = {
    agent: new SocksProxyAgent(socksUrl),
    strictSSL: false,
  };
  console.log(`已启用代理: ${socksUrl}`);
}

const bot = new TelegramBot(token, botOptions);

// ── 核心组件初始化 ────────────────────────────────────
//    并发 Worker 数 = 4（可调，根据你的 CPU 和实际负载）
//    队列最大 1000 个任务
const queue = new JobQueue(4, 1000);

//    Telegram API 限流：最多 30 条/秒
const limiter = new RateLimiter(30, 1000);

// ── 中间件链 ──────────────────────────────────────────
//    洋葱模型：logger → router
//    可以随时加新的中间件：限流、鉴权、多语言等
const app = new Middleware();
app.use(loggerMiddleware);      // 1. 记录所有消息
app.use(createRouter());        // 2. 路由到具体 handler
// 可以继续加:
// app.use(rateLimitMiddleware);
// app.use(i18nMiddleware);

// ── 消息入口（Reactor 核心） ──────────────────────────
//    收到消息 → 创建 ctx → 过中间件链 → 返回
//    主线程永远不阻塞，所有慢操作走队列
bot.on("message", (msg) => {
  // 忽略没有文字的边角消息（如贴纸、文件等）
  if (!msg.text) return;

  const ctx = createContext(bot, msg, { queue, limiter });

  // 异步执行（不 await，主线程立即返回）
  app.run(ctx).catch((err) => {
    console.error("中间件错误:", err);
  });
});

// ── 错误处理 ──────────────────────────────────────────
bot.on("polling_error", (err) => {
  // 网络抖动导致的长轮询错误，SDK 会自动重试
  // 所以只记日志，不处理
  if (err.code === "EFATAL") {
    console.warn(`[polling] 网络错误（将自动重试）: ${err.message}`);
    return;
  }
  console.error("polling_error:", err);
});

// ── 优雅退出 ──────────────────────────────────────────
async function shutdown(signal) {
  console.log(`\n收到 ${signal}，等待队列排空...`);
  await queue.waitIdle();
  console.log("队列已清空，退出。");
  process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// ── 启动 ──────────────────────────────────────────────
console.log("Bot 已启动...");
console.log(`架构: 中间件链 → 路由 → {快速直接 | 慢速入队(${queue.concurrency} Workers)}`);
console.log(`限流: ${limiter.maxTokens} 条/秒`);

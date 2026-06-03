/**
 * 消息路由中间件 — 按顺序尝试所有 handler
 *
 * 这是一个中间件工厂函数：接收 handlers 列表，返回中间件函数。
 * 每个 handler 决定是否处理该消息（不处理就调 next()）。
 */

import startHandler from "./start.js";
import helpHandler from "./help.js";
import echoHandler from "./echo.js";
import aiHandler from "./ai.js";
import statsHandler from "./stats.js";

// 注册顺序 = 匹配优先级
const handlers = [
  startHandler,
  helpHandler,
  statsHandler,
  echoHandler,
  aiHandler,
];

/**
 * 返回一个中间件函数
 */
export function createRouter() {
  return async function router(ctx, next) {
    for (const handler of handlers) {
      let handled = true;
      await handler(ctx, () => { handled = false; });
      if (handled) return; // 消息被消费，停止
    }
    // 没有 handler 匹配 → 默认回复
    await ctx.reply("未知命令。发送 /help 查看可用命令。");
  };
}

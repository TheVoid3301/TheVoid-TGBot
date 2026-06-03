/**
 * /start 处理器（快速路径 — 同步返回，不过队列）
 */
export default async function startHandler(ctx, next) {
  if (!ctx.text.startsWith("/start")) return next();

  await ctx.reply("👋 欢迎！我是 Void Bot。\n\n/help 查看帮助\n/ask 向我提问（AI 模式）");
  // 不调用 next() → 消息已被消费
}

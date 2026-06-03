/**
 * 日志中间件 — 记录每条消息的处理耗时
 */
export default async function loggerMiddleware(ctx, next) {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`[${new Date().toISOString()}] ${ctx.chatId} "${ctx.text.slice(0, 50)}" → ${ms}ms`);
}

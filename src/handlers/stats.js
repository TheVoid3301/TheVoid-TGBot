/**
 * /stats — 查看队列运行状态
 */
export default async function statsHandler(ctx, next) {
  if (!ctx.text.startsWith("/stats")) return next();

  const s = ctx.queue.stats();
  await ctx.reply(
    `📊 队列状态:\n` +
    `运行中: ${s.running}\n` +
    `等待中: ${s.pending}\n` +
    `高优先: ${s.high}\n` +
    `中优先: ${s.medium}\n` +
    `低优先: ${s.low}`,
  );
}

/**
 * /echo 处理器（快速路径）
 */
export default async function echoHandler(ctx, next) {
  const match = ctx.text.match(/^\/echo\s+(.+)/);
  if (!match) return next();

  await ctx.reply(match[1]);
}

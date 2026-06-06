/**
 * /echo 处理器（快速路径）
 */
export default async function echoHandler(ctx, next) {
  if (!ctx.text.startsWith("/echo")) return next();

  await ctx.reply(ctx.user.toString());
}

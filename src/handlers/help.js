/**
 * /help 处理器（快速路径）
 */
export default async function helpHandler(ctx, next) {
  if (!ctx.text.startsWith("/help")) return next();

  await ctx.reply("可用命令：\n/start - 开始\n/help - 帮助\n/ask <问题> - AI 问答\n/echo <文字> - 复读\n/stats - 查看队列状态");
}

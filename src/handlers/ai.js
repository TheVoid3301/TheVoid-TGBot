/**
 * /ask 处理器（慢路径 — 走队列异步处理）
 *
 * 流程:
 *   主线程收到消息 → 入队 HIGH 优先级 → Worker 池并发处理
 *   主线程立即返回，不阻塞轮询
 */

// 模拟 AI API 调用（替换成真实的 OpenAI / 自定义模型）
async function callAI(question) {
  // TODO: 替换为真实 AI 调用
  // const response = await fetch("https://your-ai-api/...", { ... });
  await new Promise((r) => setTimeout(r, 2000)); // 模拟 2 秒延迟
  return `你说的是: "${question}"。这是一个模拟的 AI 回复。`;
}

export default async function aiHandler(ctx, next) {
  const match = ctx.text.match(/^\/ask\s+(.+)/);
  if (!match) return next();

  const question = match[1];

  // 加入高优先级队列 — 主线程立即返回
  ctx.queue.add(
    async () => {
      // 先提示用户
      await ctx.replyLimited("🤔 思考中...");

      try {
        const answer = await callAI(question);
        await ctx.replyLimited(answer);
      } catch (err) {
        await ctx.replyLimited("❌ 处理请求时出错，请重试");
        console.error("AI handler error:", err);
      }
    },
    ctx.queue.constructor.HIGH, // 用户可见回复 → 高优先级
  );

  // 不调 next() → 消息已消费
}

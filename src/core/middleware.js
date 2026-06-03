/**
 * 中间件组合器（Koa 风格洋葱模型）
 *
 * 中间件签名: async (ctx, next) => {}
 * - ctx:    上下文对象，携带 msg, bot, state 等
 * - next(): 调用下一个中间件，返回 Promise
 *
 * 洋葱模型:
 *   请求 →
 *     ┌─ mid1 前半段  ─┐
 *     │  ┌─ mid2 ─┐   │
 *     │  │ handler│   │
 *     │  └────────┘   │
 *     └───────────────┘
 *   ← 响应
 *
 * 用法:
 *   const app = new Middleware();
 *   app.use(logger);      // 中间件 1
 *   app.use(router);      // 中间件 2
 *   await app.run(ctx);   // 执行
 */

class Middleware {
  constructor() {
    this.middlewares = [];
  }

  /**
   * 注册中间件
   * @param {Function} fn  (ctx, next) => Promise
   */
  use(fn) {
    this.middlewares.push(fn);
    return this; // 链式调用
  }

  /**
   * 执行中间件链
   * @param {Object} ctx 上下文
   */
  async run(ctx) {
    let i = -1;

    const dispatch = (index) => {
      if (index <= i) {
        return Promise.reject(new Error("next() 被重复调用"));
      }
      i = index;
      const fn = this.middlewares[index];
      if (!fn) return Promise.resolve();
      try {
        return Promise.resolve(fn(ctx, () => dispatch(index + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    };

    return dispatch(0);
  }
}

export default Middleware;

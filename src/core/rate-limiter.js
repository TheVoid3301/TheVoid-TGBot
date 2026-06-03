/**
 * 令牌桶限流器 — 防止超过 Telegram API 的 30 条/秒限制
 *
 * ┌──────────┐
 * │ 令牌桶    │  容量 30，每秒补充 30 个令牌
 * │ [||||| ] │
 * └────┬─────┘
 *      │ acquire() → 拿不到令牌就等
 *      ▼
 *   发送消息
 */

class RateLimiter {
  /**
   * @param {number} maxTokens   桶容量（最大突发请求数）
   * @param {number} interval    补充间隔（毫秒）
   */
  constructor(maxTokens = 30, interval = 1000) {
    this.maxTokens = maxTokens;
    this.interval = interval;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
    this.waitQueue = [];
  }

  _refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    // 按时间比例补充令牌
    const refill = (elapsed / this.interval) * this.maxTokens;
    this.tokens = Math.min(this.maxTokens, this.tokens + refill);
    this.lastRefill = now;
  }

  /**
   * 获取一个令牌。如果当前没有令牌，等待直到有。
   */
  async acquire() {
    this._refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // 需要等待 — 计算预计多久能有新令牌
    const waitMs = Math.ceil((1 - this.tokens) / this.maxTokens * this.interval);
    return new Promise((resolve) => {
      setTimeout(() => {
        this.tokens = Math.max(0, this.tokens - 1);
        resolve();
      }, waitMs);
    });
  }

  /**
   * 包裹一个异步函数，使其受限流控制
   * @returns {Function} 被限流包裹后的函数
   */
  wrap(fn) {
    return async (...args) => {
      await this.acquire();
      return fn(...args);
    };
  }
}

export default RateLimiter;

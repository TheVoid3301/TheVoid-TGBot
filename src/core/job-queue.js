/**
 * 优先级异步任务队列
 *
 * ┌──────────────┐     ┌──────────┐     ┌──────────┐
 * │  add(job)    │ ──▶ │  Queue   │ ──▶ │ Worker 1 │
 * │  priority: H │     │  [H][M]  │     │ Worker 2 │
 * │  priority: M │     │  [L][L]  │     │ ...      │
 * └──────────────┘     └──────────┘     └──────────┘
 *
 * H = 高优先（用户可见回复）
 * M = 中优先（数据库写入等）
 * L = 低优先（日志、统计）
 */

const PRIORITY = { HIGH: 0, MEDIUM: 1, LOW: 2 };

class JobQueue {
  /**
   * @param {number} concurrency  最大并发 Worker 数
   * @param {number} maxSize      队列最大长度（超过则拒绝入队）
   */
  constructor(concurrency = 4, maxSize = 1000) {
    this.concurrency = concurrency;
    this.maxSize = maxSize;

    // 三个优先级桶，按顺序消费
    this.buckets = { [PRIORITY.HIGH]: [], [PRIORITY.MEDIUM]: [], [PRIORITY.LOW]: [] };
    this.running = 0;
    this.pending = 0;
    this._resolveWait = null;
  }

  /**
   * 添加任务到队列
   * @param {Function} fn    异步任务函数
   * @param {number} priority 优先级 (JobQueue.HIGH / MEDIUM / LOW)
   * @returns {Promise} fn 的返回值
   */
  add(fn, priority = PRIORITY.MEDIUM) {
    if (this.pending >= this.maxSize) {
      return Promise.reject(new Error("JobQueue: 队列已满，拒绝新任务"));
    }

    return new Promise((resolve, reject) => {
      const job = { fn, resolve, reject, priority, createdAt: Date.now() };
      this.buckets[priority].push(job);
      this.pending++;
      this._drain();
    });
  }

  /**
   * 从各优先级桶中取出下一个任务（高优先先消费）
   */
  _nextJob() {
    for (const p of [PRIORITY.HIGH, PRIORITY.MEDIUM, PRIORITY.LOW]) {
      if (this.buckets[p].length > 0) {
        this.pending--;
        return this.buckets[p].shift();
      }
    }
    return null;
  }

  /**
   * 尝试启动新的 Worker
   */
  _drain() {
    while (this.running < this.concurrency) {
      const job = this._nextJob();
      if (!job) break;
      this.running++;
      this._run(job);
    }
  }

  async _run(job) {
    try {
      const result = await job.fn();
      job.resolve(result);
    } catch (err) {
      job.reject(err);
    } finally {
      this.running--;
      this._drain();
      // 通知 waitIdle
      if (this._resolveWait && this.size === 0 && this.running === 0) {
        this._resolveWait();
        this._resolveWait = null;
      }
    }
  }

  /** 队列中未开始的任务数 */
  get size() {
    return this.buckets[PRIORITY.HIGH].length
      + this.buckets[PRIORITY.MEDIUM].length
      + this.buckets[PRIORITY.LOW].length;
  }

  /** 统计信息 */
  stats() {
    return {
      running: this.running,
      pending: this.size,
      high: this.buckets[PRIORITY.HIGH].length,
      medium: this.buckets[PRIORITY.MEDIUM].length,
      low: this.buckets[PRIORITY.LOW].length,
    };
  }

  /** 等待所有任务完成 */
  waitIdle() {
    if (this.size === 0 && this.running === 0) return Promise.resolve();
    return new Promise((resolve) => { this._resolveWait = resolve; });
  }
}

JobQueue.HIGH = PRIORITY.HIGH;
JobQueue.MEDIUM = PRIORITY.MEDIUM;
JobQueue.LOW = PRIORITY.LOW;

export default JobQueue;

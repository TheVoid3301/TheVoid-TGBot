/**
 * 上下文对象 — 贯穿整个中间件链
 *
 * ctx = {
 *   bot,        // TelegramBot 实例
 *   msg,        // 当前 message 对象
 *   chatId,     // 快捷属性 = msg.chat.id
 *   text,       // 快捷属性 = msg.text
 *   state,      // 中间件间传递数据的命名空间
 *   queue,      // 引向 JobQueue
 *   limiter,    // 引向 RateLimiter
 * }
 */
import { User } from '../entity/user.js'

export function createContext(bot, msg, { queue, limiter } = {}) {
  return {
    bot,
    msg,
    chatId: msg.chat?.id,
    text: msg.text ?? "",
    user: new User(msg.from.id, msg.from.username, msg.from.first_name, 
      msg.from.last_name, msg.from.language_code, msg.from.is_preminum
    ),
    state: {}, // 中间件用这个传数据
    queue,
    limiter,

    /** 快捷回复 */
    reply(text, options) {
      return bot.sendMessage(msg.chat.id, text, options);
    },

    /** 限流后的快捷回复 */
    async replyLimited(text, options) {
      await limiter?.acquire();
      return bot.sendMessage(msg.chat.id, text, options);
    },
  };
}

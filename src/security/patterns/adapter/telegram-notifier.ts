import { describeAlert, type Alert, type Delivery } from "../../domain/alert.ts";
import type { AlertNotifier } from "../decorator/alert-notifier.ts";
import type { HttpPost } from "./http.ts";

/**
 * Adaptee: the Telegram Bot API (third-party, https://core.telegram.org/bots/api).
 * POST https://api.telegram.org/bot<token>/sendMessage  {"chat_id": …, "text": …}
 * answers {"ok": true, "result": …} or {"ok": false, "error_code": 429,
 * "description": "Too Many Requests: retry after 5"}; one call per chat.
 */
interface TelegramAnswer {
  readonly ok?: boolean;
  readonly description?: string;
}

/**
 * Adapter: an AlertNotifier (Target) on top of the Bot API. Translates an
 * Alert into one sendMessage per chat and the API's answers into a Delivery.
 * The token is part of the URL, so it never appears in a Delivery or a log.
 */
export class TelegramNotifier implements AlertNotifier {
  readonly channel = "telegram";
  private readonly endpoint: string;
  private readonly chatIds: readonly string[];
  private readonly post: HttpPost;

  constructor(token: string, chatIds: readonly string[], post: HttpPost) {
    if (!token || chatIds.length === 0) throw new Error("telegram needs a token and at least one chat id");
    this.endpoint = `https://api.telegram.org/bot${token}/sendMessage`;
    this.chatIds = chatIds;
    this.post = post;
  }

  async notify(alert: Alert): Promise<Delivery> {
    const text = describeAlert(alert);
    const failed: string[] = [];
    for (const chatId of this.chatIds) {
      const response = await this.post(this.endpoint, { chat_id: chatId, text });
      const answer = (response.json ?? {}) as TelegramAnswer;
      if (!answer.ok) failed.push(`chat ${chatId}: ${answer.description ?? `HTTP ${response.status}`}`);
    }
    return failed.length === 0
      ? { sent: true, channel: this.channel, detail: `delivered to ${this.chatIds.length} chat(s)` }
      : { sent: false, channel: this.channel, detail: failed.join("; ") };
  }
}

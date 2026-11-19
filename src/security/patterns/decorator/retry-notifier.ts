import type { Alert, Delivery } from "../../domain/alert.ts";
import type { AlertNotifier } from "./alert-notifier.ts";
import { NotifierDecorator } from "./notifier-decorator.ts";

export type Sleep = (ms: number) => Promise<void>;
const realSleep: Sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Concrete Decorator: tries again when the wrapped channel fails (an error
 * answer or an exception, e.g. no network for a moment), waiting longer each time.
 */
export class RetryNotifier extends NotifierDecorator {
  private readonly attempts: number;
  private readonly delayMs: number;
  private readonly sleep: Sleep;

  constructor(inner: AlertNotifier, attempts: number, delayMs: number, sleep: Sleep = realSleep) {
    super(inner);
    if (attempts < 1) throw new Error("attempts must be at least 1");
    this.attempts = attempts;
    this.delayMs = delayMs;
    this.sleep = sleep;
  }

  override async notify(alert: Alert): Promise<Delivery> {
    let delivery: Delivery = { sent: false, channel: this.channel, detail: "not tried" };
    let attempt = 0;
    while (attempt < this.attempts) {
      attempt++;
      try {
        delivery = await super.notify(alert);
      } catch (e) {
        delivery = { sent: false, channel: this.channel, detail: `error: ${(e as Error).message}` };
      }
      // A cooldown inside is a decision, not a failure: trying again would not change it.
      if (delivery.sent || delivery.detail.startsWith("suppressed")) break;
      if (attempt < this.attempts) await this.sleep(this.delayMs * attempt);
    }
    return { ...delivery, detail: `${delivery.detail} (attempt ${attempt}/${this.attempts})` };
  }
}

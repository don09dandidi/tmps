import type { Alert, Delivery } from "../../domain/alert.ts";
import type { AlertNotifier } from "./alert-notifier.ts";
import { NotifierDecorator } from "./notifier-decorator.ts";

/**
 * Concrete Decorator: at most one alert per camera every `seconds`, so a
 * person standing in the yard gives one message, not one per second.
 */
export class CooldownNotifier extends NotifierDecorator {
  private readonly windowMs: number;
  private readonly now: () => number;
  private readonly lastSent = new Map<string, number>();

  constructor(inner: AlertNotifier, seconds: number, now: () => number = Date.now) {
    super(inner);
    this.windowMs = seconds * 1000;
    this.now = now;
  }

  override async notify(alert: Alert): Promise<Delivery> {
    const t = this.now();
    const last = this.lastSent.get(alert.cameraId);
    if (last !== undefined && t - last < this.windowMs) {
      const left = Math.ceil((this.windowMs - (t - last)) / 1000);
      return { sent: false, channel: this.channel, detail: `suppressed: cooldown, ${left} s left` };
    }
    const delivery = await super.notify(alert);
    if (delivery.sent) this.lastSent.set(alert.cameraId, t);
    return delivery;
  }
}

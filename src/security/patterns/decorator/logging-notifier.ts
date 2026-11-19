import type { Alert, Delivery } from "../../domain/alert.ts";
import type { AlertNotifier } from "./alert-notifier.ts";
import { NotifierDecorator } from "./notifier-decorator.ts";

/** Concrete Decorator: writes every alert and its outcome to a log. */
export class LoggingNotifier extends NotifierDecorator {
  private readonly log: (line: string) => void;

  constructor(inner: AlertNotifier, log: (line: string) => void) {
    super(inner);
    this.log = log;
  }

  override async notify(alert: Alert): Promise<Delivery> {
    this.log(`[${this.channel}] alert ${alert.cameraId} (${Math.round(alert.confidence * 100)}%)`);
    const delivery = await super.notify(alert);
    this.log(`[${this.channel}] ${delivery.sent ? "sent" : "NOT sent"}: ${delivery.detail}`);
    return delivery;
  }
}

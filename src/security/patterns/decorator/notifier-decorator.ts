import type { Alert, Delivery } from "../../domain/alert.ts";
import type { AlertNotifier } from "./alert-notifier.ts";

/**
 * Decorator — Base Decorator: has an AlertNotifier and is one. By default it
 * only forwards; concrete decorators override notify() and call super.notify()
 * where the wrapped notifier must run.
 */
export abstract class NotifierDecorator implements AlertNotifier {
  protected readonly inner: AlertNotifier;

  protected constructor(inner: AlertNotifier) {
    this.inner = inner;
  }

  get channel(): string {
    return this.inner.channel;
  }

  notify(alert: Alert): Promise<Delivery> {
    return this.inner.notify(alert);
  }
}

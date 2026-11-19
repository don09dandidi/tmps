import { describeAlert, type Alert, type Delivery } from "../../domain/alert.ts";
import type { AlertNotifier } from "./alert-notifier.ts";

/** Decorator — Concrete Component: prints the alert (local console / log). */
export class ConsoleNotifier implements AlertNotifier {
  readonly channel = "console";
  private readonly write: (line: string) => void;

  constructor(write: (line: string) => void = console.log) {
    this.write = write;
  }

  async notify(alert: Alert): Promise<Delivery> {
    this.write(describeAlert(alert));
    return { sent: true, channel: this.channel, detail: "printed" };
  }
}

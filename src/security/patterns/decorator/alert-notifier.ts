import type { Alert, Delivery } from "../../domain/alert.ts";

/** Decorator — Component: anything that can deliver an alert to people. */
export interface AlertNotifier {
  readonly channel: string;
  notify(alert: Alert): Promise<Delivery>;
}

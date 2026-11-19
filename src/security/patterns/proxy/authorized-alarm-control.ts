import type { AlarmControl, CommandResult, Requester } from "./alarm-control.ts";

/**
 * Proxy — Protection Proxy: the same interface as the real panel. Anyone can
 * find a Telegram bot and write to it, so only the allowed requesters reach
 * the panel; every attempt is written to the audit log.
 */
export class AuthorizedAlarmControl implements AlarmControl {
  private readonly real: AlarmControl;
  private readonly allowed: ReadonlySet<string>;
  private readonly audit: (line: string) => void;

  constructor(real: AlarmControl, allowedIds: Iterable<string>, audit: (line: string) => void) {
    this.real = real;
    this.allowed = new Set(allowedIds);
    this.audit = audit;
  }

  arm(zone: string, by: Requester): Promise<CommandResult> {
    return this.guard("arm", by, () => this.real.arm(zone, by));
  }

  disarm(zone: string, by: Requester): Promise<CommandResult> {
    return this.guard("disarm", by, () => this.real.disarm(zone, by));
  }

  status(by: Requester): Promise<CommandResult> {
    return this.guard("status", by, () => this.real.status(by));
  }

  private async guard(action: string, by: Requester, call: () => Promise<CommandResult>): Promise<CommandResult> {
    if (!this.allowed.has(by.id)) {
      this.audit(`DENIED ${action} for ${by.name} (${by.id})`);
      return { ok: false, message: "⛔ Acces refuzat." };
    }
    this.audit(`allowed ${action} for ${by.name} (${by.id})`);
    return call();
  }
}

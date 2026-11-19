/** Who sent a command (e.g. a Telegram chat). */
export interface Requester {
  readonly id: string;
  readonly name: string;
}

export interface CommandResult {
  readonly ok: boolean;
  readonly message: string;
}

/** Proxy — Subject: arming, disarming and the state of the property. */
export interface AlarmControl {
  arm(zone: string, by: Requester): Promise<CommandResult>;
  disarm(zone: string, by: Requester): Promise<CommandResult>;
  status(by: Requester): Promise<CommandResult>;
}

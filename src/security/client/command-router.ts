import type { AlarmControl, CommandResult, Requester } from "../patterns/proxy/alarm-control.ts";

/**
 * Client: turns chat commands into AlarmControl calls. It depends only on the
 * interface; it gets the protection proxy and cannot tell it from the panel.
 *   /armeaza [zona]  /dezarmeaza [zona]  /stare     (no zone = whole property)
 */
export class CommandRouter {
  private readonly control: AlarmControl;

  constructor(control: AlarmControl) {
    this.control = control;
  }

  handle(text: string, by: Requester): Promise<CommandResult> {
    const [command = "", ...rest] = text.trim().split(/\s+/);
    const zone = rest.join(" ");
    switch (command.toLowerCase()) {
      case "/armeaza":
        return this.control.arm(zone, by);
      case "/dezarmeaza":
        return this.control.disarm(zone, by);
      case "/stare":
        return this.control.status(by);
      default:
        return Promise.resolve({ ok: false, message: "Comenzi: /armeaza [zona], /dezarmeaza [zona], /stare" });
    }
  }
}

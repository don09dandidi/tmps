import type { CameraHealthSource } from "../adapter/camera-health-source.ts";
import type { SecurityZone } from "../composite/security-zone.ts";
import type { AlarmControl, CommandResult, Requester } from "./alarm-control.ts";

/**
 * Proxy — Real Subject: does the work on the zones (Composite) and asks the
 * cameras' health (through the go2rtc Adapter). It trusts every caller; the
 * access check is the proxy's job.
 */
export class AlarmPanel implements AlarmControl {
  private readonly property: SecurityZone;
  private readonly health: CameraHealthSource;

  constructor(property: SecurityZone, health: CameraHealthSource) {
    this.property = property;
    this.health = health;
  }

  arm(zone: string, by: Requester): Promise<CommandResult> {
    return Promise.resolve(this.change(zone, true, by));
  }

  disarm(zone: string, by: Requester): Promise<CommandResult> {
    return Promise.resolve(this.change(zone, false, by));
  }

  async status(_by: Requester): Promise<CommandResult> {
    const health = await this.health.healthOf(this.property.streamNames());
    return { ok: true, message: this.property.render(health).join("\n") };
  }

  private change(name: string, armed: boolean, by: Requester): CommandResult {
    const zone = name.trim() ? this.property.findZone(name) : this.property;
    if (!zone) return { ok: false, message: `Nu există zona sau camera "${name}".` };
    zone.setArmed(armed);
    const verb = armed ? "armată" : "dezarmată";
    return { ok: true, message: `${zone.name} ${verb} de ${by.name} (${zone.armedCount()}/${zone.cameraCount()} camere armate).` };
  }
}

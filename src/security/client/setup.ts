import { CameraBuilder } from "../creational/camera-builder.ts";
import { NotifierFactory, type DecoratorSpec } from "../creational/notifier-factory.ts";
import type { CameraHealthSource } from "../patterns/adapter/camera-health-source.ts";
import { CameraPoint } from "../patterns/composite/camera-point.ts";
import type { SecurityZone } from "../patterns/composite/security-zone.ts";
import { ZoneGroup } from "../patterns/composite/zone-group.ts";
import type { AlertNotifier } from "../patterns/decorator/alert-notifier.ts";
import { CooldownNotifier } from "../patterns/decorator/cooldown-notifier.ts";
import { LoggingNotifier } from "../patterns/decorator/logging-notifier.ts";
import { RetryNotifier, type Sleep } from "../patterns/decorator/retry-notifier.ts";
import { AlarmPanel } from "../patterns/proxy/alarm-panel.ts";
import type { AlarmControl } from "../patterns/proxy/alarm-control.ts";
import { AuthorizedAlarmControl } from "../patterns/proxy/authorized-alarm-control.ts";

/**
 * Composition root: the only place that names concrete classes. Everything
 * else receives interfaces.
 */

/** The house: 4 Hikvision cameras behind go2rtc, in two zones. */
export function buildProperty(go2rtcBase: string): ZoneGroup {
  const camera = (id: string, name: string, location: string) =>
    new CameraPoint(new CameraBuilder().withId(id).named(name).at(location).fromGo2rtc(go2rtcBase, id).build());
  return new ZoneGroup("Proprietate", [
    new ZoneGroup("Curte", [camera("camera_01", "Poarta", "Curte"), camera("camera_02", "Curtea din spate", "Curte")]),
    new ZoneGroup("Casă", [camera("camera_03", "Intrare", "Casă"), camera("camera_04", "Garaj", "Casă")]),
  ]);
}

/** Every layer the notification policy may use, by name. */
export function notifierFactory(log: (line: string) => void, now: () => number = Date.now, sleep?: Sleep): NotifierFactory {
  return new NotifierFactory()
    .register("logging", (inner) => new LoggingNotifier(inner, log))
    .register("cooldown", (inner, o) => new CooldownNotifier(inner, o.seconds ?? 120, now))
    .register("retry", (inner, o) => new RetryNotifier(inner, o.attempts ?? 3, o.delayMs ?? 1000, sleep));
}

/** The policy used by the house, outermost layer first. */
export const ALERT_POLICY: readonly DecoratorSpec[] = [
  { kind: "logging" },
  { kind: "cooldown", options: { seconds: 120 } },
  { kind: "retry", options: { attempts: 3, delayMs: 300 } },
];

export function alarmControl(property: SecurityZone, health: CameraHealthSource, allowed: string[], audit: (l: string) => void): AlarmControl {
  return new AuthorizedAlarmControl(new AlarmPanel(property, health), allowed, audit);
}

export type { AlertNotifier };

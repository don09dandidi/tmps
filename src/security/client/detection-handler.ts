import type { Delivery } from "../domain/alert.ts";
import type { SecurityZone } from "../patterns/composite/security-zone.ts";
import type { AlertNotifier } from "../patterns/decorator/alert-notifier.ts";

/**
 * Client: what happens when the person detector sees someone. It knows the
 * property only as a SecurityZone (Composite) and the channel only as an
 * AlertNotifier: it does not know which decorators wrap it or that the
 * channel at the bottom is a Telegram adapter.
 */
export class DetectionHandler {
  private readonly property: SecurityZone;
  private readonly notifier: AlertNotifier;

  constructor(property: SecurityZone, notifier: AlertNotifier) {
    this.property = property;
    this.notifier = notifier;
  }

  async onPersonDetected(cameraId: string, confidence: number, at: Date = new Date()): Promise<Delivery> {
    const found = this.property.findCamera(cameraId);
    if (!found) return { sent: false, channel: this.notifier.channel, detail: `unknown camera ${cameraId}` };
    if (!found.armed) return { sent: false, channel: this.notifier.channel, detail: `ignored: ${found.camera.name} is disarmed` };
    return this.notifier.notify({ cameraId, cameraName: found.camera.name, zone: found.zone, confidence, at });
  }
}

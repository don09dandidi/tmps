import type { Alert, Delivery } from "../../src/security/domain/alert.ts";
import type { AlertNotifier } from "../../src/security/patterns/decorator/alert-notifier.ts";

export function alert(cameraId = "camera_01", confidence = 0.9): Alert {
  return { cameraId, cameraName: cameraId, zone: "Curte", confidence, at: new Date(2026, 10, 19, 20, 33, 0) };
}

/** A channel that records what it received; fails the first `failures` calls. */
export class RecordingChannel implements AlertNotifier {
  readonly channel = "test";
  readonly received: Alert[] = [];
  calls = 0;
  private failures: number;

  constructor(failures = 0) {
    this.failures = failures;
  }

  async notify(a: Alert): Promise<Delivery> {
    this.calls++;
    if (this.failures > 0) {
      this.failures--;
      return { sent: false, channel: this.channel, detail: "temporary failure" };
    }
    this.received.push(a);
    return { sent: true, channel: this.channel, detail: "ok" };
  }
}

export const noSleep = async () => {};

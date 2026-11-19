import type { CameraHealth } from "../../domain/camera-health.ts";

/** Adapter — Target: what the application needs to know about its cameras. */
export interface CameraHealthSource {
  /** Health of each requested go2rtc stream; never throws (unknown on failure). */
  healthOf(streams: readonly string[]): Promise<ReadonlyMap<string, CameraHealth>>;
}

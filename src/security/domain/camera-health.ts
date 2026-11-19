/** Is a camera sending picture right now, and how many are watching it. */
export type HealthState = "live" | "idle" | "unknown";

export interface CameraHealth {
  readonly state: HealthState;
  readonly viewers: number;
}

export const UNKNOWN_HEALTH: CameraHealth = Object.freeze({ state: "unknown", viewers: 0 });

/** go2rtc stream name of a camera: the `src` parameter of its stream URL. */
export function streamNameOf(streamUrl: string | undefined): string | undefined {
  if (!streamUrl) return undefined;
  try {
    return new URL(streamUrl).searchParams.get("src") ?? undefined;
  } catch {
    return undefined;
  }
}

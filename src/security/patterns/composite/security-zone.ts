import type { Camera } from "../../../lib/types.ts";
import type { CameraHealth } from "../../domain/camera-health.ts";

/** Where a camera was found and whether it is watched. */
export interface CameraLookup {
  readonly camera: Camera;
  readonly armed: boolean;
  /** Path of the groups above the camera, e.g. "Proprietate › Curte". */
  readonly zone: string;
}

/**
 * Composite — Component. One camera and a whole group of zones are used the
 * same way: arm/disarm, count, search, render. The client never asks which of
 * the two it holds.
 */
export interface SecurityZone {
  readonly name: string;
  setArmed(armed: boolean): void;
  armedCount(): number;
  cameraCount(): number;
  /** The zone with this name (a group) or id (a camera), here or below. */
  findZone(name: string): SecurityZone | undefined;
  findCamera(cameraId: string): CameraLookup | undefined;
  /** go2rtc stream names of all cameras here or below. */
  streamNames(): string[];
  render(health: ReadonlyMap<string, CameraHealth>, indent?: string): string[];
}

import type { Camera } from "../../../lib/types.ts";
import { streamNameOf, UNKNOWN_HEALTH, type CameraHealth } from "../../domain/camera-health.ts";
import type { CameraLookup, SecurityZone } from "./security-zone.ts";

const HEALTH_TEXT = { live: "transmite", idle: "conectată, fără imagine acum", unknown: "stare necunoscută" };

/** Composite — Leaf: a single camera. A disabled camera can never be armed. */
export class CameraPoint implements SecurityZone {
  private readonly camera: Camera;
  private armed: boolean;

  constructor(camera: Camera) {
    this.camera = camera;
    this.armed = camera.status === "live";
  }

  get name(): string {
    return this.camera.name;
  }

  setArmed(armed: boolean): void {
    this.armed = armed && this.camera.status === "live";
  }

  armedCount(): number {
    return this.armed ? 1 : 0;
  }

  cameraCount(): number {
    return 1;
  }

  findZone(name: string): SecurityZone | undefined {
    return matches(name, this.camera.id) || matches(name, this.camera.name) ? this : undefined;
  }

  findCamera(cameraId: string): CameraLookup | undefined {
    return cameraId === this.camera.id ? { camera: this.camera, armed: this.armed, zone: "" } : undefined;
  }

  streamNames(): string[] {
    const stream = streamNameOf(this.camera.streamUrl);
    return stream ? [stream] : [];
  }

  render(health: ReadonlyMap<string, CameraHealth>, indent = ""): string[] {
    const stream = streamNameOf(this.camera.streamUrl);
    const h = (stream && health.get(stream)) || UNKNOWN_HEALTH;
    const watchers = h.viewers ? `, ${h.viewers} privitori` : "";
    const state = this.camera.status === "live" ? (this.armed ? "ARMATĂ" : "dezarmată") : "dezactivată";
    return [`${indent}📷 ${this.camera.name} [${this.camera.id}]: ${state}, ${HEALTH_TEXT[h.state]}${watchers}`];
  }
}

export function matches(query: string, value: string): boolean {
  return query.trim().toLowerCase() === value.trim().toLowerCase();
}

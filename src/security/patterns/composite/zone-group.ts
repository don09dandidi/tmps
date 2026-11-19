import type { CameraHealth } from "../../domain/camera-health.ts";
import { matches } from "./camera-point.ts";
import type { CameraLookup, SecurityZone } from "./security-zone.ts";

/**
 * Composite — Composite: a named group of zones (cameras or other groups).
 * Every operation is forwarded to the children and the results are combined.
 */
export class ZoneGroup implements SecurityZone {
  readonly name: string;
  private readonly children: SecurityZone[] = [];

  constructor(name: string, children: readonly SecurityZone[] = []) {
    this.name = name;
    this.children.push(...children);
  }

  add(child: SecurityZone): this {
    this.children.push(child);
    return this;
  }

  setArmed(armed: boolean): void {
    for (const child of this.children) child.setArmed(armed);
  }

  armedCount(): number {
    return this.children.reduce((sum, c) => sum + c.armedCount(), 0);
  }

  cameraCount(): number {
    return this.children.reduce((sum, c) => sum + c.cameraCount(), 0);
  }

  findZone(name: string): SecurityZone | undefined {
    if (matches(name, this.name)) return this;
    for (const child of this.children) {
      const found = child.findZone(name);
      if (found) return found;
    }
    return undefined;
  }

  findCamera(cameraId: string): CameraLookup | undefined {
    for (const child of this.children) {
      const found = child.findCamera(cameraId);
      if (found) return { ...found, zone: found.zone ? `${this.name} › ${found.zone}` : this.name };
    }
    return undefined;
  }

  streamNames(): string[] {
    return this.children.flatMap((c) => c.streamNames());
  }

  render(health: ReadonlyMap<string, CameraHealth>, indent = ""): string[] {
    const header = `${indent}▸ ${this.name} (${this.armedCount()}/${this.cameraCount()} camere armate)`;
    return [header, ...this.children.flatMap((c) => c.render(health, indent + "    "))];
  }
}

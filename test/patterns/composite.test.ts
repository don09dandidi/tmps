import { test } from "node:test";
import assert from "node:assert/strict";
import { CameraBuilder } from "../../src/security/creational/camera-builder.ts";
import { CameraPoint } from "../../src/security/patterns/composite/camera-point.ts";
import type { SecurityZone } from "../../src/security/patterns/composite/security-zone.ts";
import { ZoneGroup } from "../../src/security/patterns/composite/zone-group.ts";

const cam = (id: string, enabled = true) => {
  const b = new CameraBuilder().withId(id).named(id).fromGo2rtc("http://g:1984", id);
  return new CameraPoint((enabled ? b : b.disabled()).build());
};

/** Client code that only knows the Component interface. */
function disarmAndCount(zone: SecurityZone): [number, number] {
  zone.setArmed(false);
  return [zone.armedCount(), zone.cameraCount()];
}

test("a leaf and a group are used through the same interface", () => {
  const leaf = cam("camera_01");
  const group = new ZoneGroup("Curte", [cam("camera_02"), cam("camera_03")]);
  assert.deepEqual(disarmAndCount(leaf), [0, 1]);
  assert.deepEqual(disarmAndCount(group), [0, 2]);
  assert.deepEqual(group.streamNames(), ["camera_02", "camera_03"]);
});

test("arming a group arms every camera below it, at any depth", () => {
  const curte = new ZoneGroup("Curte", [cam("camera_01"), cam("camera_02")]);
  const casa = new ZoneGroup("Casă", [cam("camera_03")]);
  const property = new ZoneGroup("Proprietate", [curte, casa]);
  property.setArmed(false);
  assert.equal(property.armedCount(), 0);
  property.findZone("curte")!.setArmed(true); // case-insensitive lookup
  assert.equal(property.armedCount(), 2);
  assert.equal(casa.armedCount(), 0);
  assert.deepEqual(property.findCamera("camera_02"), {
    camera: property.findCamera("camera_02")!.camera,
    armed: true,
    zone: "Proprietate › Curte",
  });
});

test("a disabled camera stays disarmed when its group is armed", () => {
  const group = new ZoneGroup("Casă", [cam("camera_03"), cam("camera_04", false)]);
  group.setArmed(true);
  assert.equal(group.armedCount(), 1);
  assert.equal(group.cameraCount(), 2);
});

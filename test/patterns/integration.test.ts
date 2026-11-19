import { test } from "node:test";
import assert from "node:assert/strict";
import { CameraBuilder } from "../../src/security/creational/camera-builder.ts";
import { CommandRouter } from "../../src/security/client/command-router.ts";
import { DetectionHandler } from "../../src/security/client/detection-handler.ts";
import { alarmControl, ALERT_POLICY, buildProperty, notifierFactory } from "../../src/security/client/setup.ts";
import { Go2rtcHealthAdapter } from "../../src/security/patterns/adapter/go2rtc-health-adapter.ts";
import { TelegramNotifier } from "../../src/security/patterns/adapter/telegram-notifier.ts";
import { noSleep } from "./helpers.ts";

const owner = { id: "111", name: "Daniel" };

test("builder: a camera with its go2rtc stream URL, validated and immutable", () => {
  const c = new CameraBuilder().withId("camera_01").named("Poarta").at("Curte").fromGo2rtc("http://127.0.0.1:1984", "camera_01").build();
  assert.equal(c.streamUrl, "http://127.0.0.1:1984/api/stream.m3u8?src=camera_01");
  assert.equal(c.status, "live");
  assert.ok(Object.isFrozen(c));
  assert.throws(() => new CameraBuilder().withId("camera_02").build(), /needs a name/);
});

test("command path: router -> proxy -> panel -> composite -> go2rtc adapter", async () => {
  const property = buildProperty("http://g:1984");
  const health = new Go2rtcHealthAdapter("http://g:1984", async () => ({
    status: 200,
    json: { camera_01: { producers: [{ remote_addr: "x" }], consumers: [] } },
  }));
  const router = new CommandRouter(alarmControl(property, health, [owner.id], () => {}));
  assert.equal((await router.handle("/dezarmeaza curte", { id: "5", name: "X" })).ok, false);
  assert.equal(property.armedCount(), 4); // nothing changed
  const r = await router.handle("/dezarmeaza curte", owner);
  assert.equal(r.message, "Curte dezarmată de Daniel (0/2 camere armate).");
  const status = (await router.handle("/stare", owner)).message;
  assert.match(status, /Poarta \[camera_01\]: dezarmată, transmite/);
  assert.match(status, /Garaj \[camera_04\]: ARMATĂ, stare necunoscută/);
});

test("detection path: composite -> decorator chain -> telegram adapter", async () => {
  const property = buildProperty("http://g:1984");
  property.findZone("Casă")!.setArmed(false);
  const sent: string[] = [];
  const telegram = new TelegramNotifier("1:T", ["111"], async (_url, body) => {
    sent.push((body as { text: string }).text);
    return { status: 200, json: { ok: true } };
  });
  const handler = new DetectionHandler(property, notifierFactory(() => {}, () => 0, noSleep).create(telegram, ALERT_POLICY));
  assert.match((await handler.onPersonDetected("camera_03", 0.9)).detail, /Intrare is disarmed/);
  assert.equal((await handler.onPersonDetected("camera_01", 0.9)).sent, true);
  assert.equal((await handler.onPersonDetected("camera_01", 0.9)).sent, false); // cooldown
  assert.equal(sent.length, 1);
  assert.match(sent[0], /Poarta \(Proprietate › Curte\)/);
});

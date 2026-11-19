import { test } from "node:test";
import assert from "node:assert/strict";
import { CooldownNotifier } from "../../src/security/patterns/decorator/cooldown-notifier.ts";
import { LoggingNotifier } from "../../src/security/patterns/decorator/logging-notifier.ts";
import { RetryNotifier } from "../../src/security/patterns/decorator/retry-notifier.ts";
import { NotifierDecorator } from "../../src/security/patterns/decorator/notifier-decorator.ts";
import type { AlertNotifier } from "../../src/security/patterns/decorator/alert-notifier.ts";
import type { Alert, Delivery } from "../../src/security/domain/alert.ts";
import { notifierFactory } from "../../src/security/client/setup.ts";
import { alert, noSleep, RecordingChannel } from "./helpers.ts";

test("cooldown lets one alert per camera through in its window", async () => {
  let now = 0;
  const channel = new RecordingChannel();
  const n = new CooldownNotifier(channel, 120, () => now);
  assert.equal((await n.notify(alert("camera_01"))).sent, true);
  now = 60_000;
  const second = await n.notify(alert("camera_01"));
  assert.equal(second.sent, false);
  assert.match(second.detail, /cooldown, 60 s left/);
  assert.equal((await n.notify(alert("camera_02"))).sent, true); // other camera: own window
  now = 121_000;
  assert.equal((await n.notify(alert("camera_01"))).sent, true);
  assert.equal(channel.received.length, 3);
});

test("retry tries again until the channel succeeds, and stops at the limit", async () => {
  const flaky = new RecordingChannel(2);
  const ok = await new RetryNotifier(flaky, 3, 10, noSleep).notify(alert());
  assert.equal(ok.sent, true);
  assert.equal(flaky.calls, 3);
  assert.match(ok.detail, /attempt 3\/3/);

  const dead = new RecordingChannel(10);
  const failed = await new RetryNotifier(dead, 2, 10, noSleep).notify(alert());
  assert.equal(failed.sent, false);
  assert.equal(dead.calls, 2);
});

test("cooldown and retry stacked in either order give the same deliveries", async () => {
  for (const order of ["cooldown(retry(x))", "retry(cooldown(x))"]) {
    const channel = new RecordingChannel(1); // first call fails once
    const now = () => 0;
    const n =
      order === "cooldown(retry(x))"
        ? new CooldownNotifier(new RetryNotifier(channel, 3, 1, noSleep), 120, now)
        : new RetryNotifier(new CooldownNotifier(channel, 120, now), 3, 1, noSleep);
    const first = await n.notify(alert("camera_01"));
    const duplicate = await n.notify(alert("camera_01"));
    assert.equal(first.sent, true, order);
    assert.equal(duplicate.sent, false, order);
    assert.match(duplicate.detail, /suppressed/, order);
    assert.equal(channel.received.length, 1, order);
    assert.equal(channel.calls, 2, order); // 1 failure + 1 success, the duplicate never reaches the channel
  }
});

test("logging records the alert and the outcome without changing it", async () => {
  const lines: string[] = [];
  const delivery = await new LoggingNotifier(new RecordingChannel(), (l) => lines.push(l)).notify(alert("camera_04", 0.5));
  assert.deepEqual(delivery, { sent: true, channel: "test", detail: "ok" });
  assert.deepEqual(lines, ["[test] alert camera_04 (50%)", "[test] sent: ok"]);
});

test("the factory builds the chain in policy order and rejects unknown layers", async () => {
  const lines: string[] = [];
  const channel = new RecordingChannel();
  const n = notifierFactory((l) => lines.push(l), () => 0, noSleep).create(channel, [
    { kind: "logging" },
    { kind: "cooldown", options: { seconds: 30 } },
  ]);
  await n.notify(alert());
  await n.notify(alert());
  assert.equal(channel.received.length, 1);
  assert.match(lines[3], /suppressed: cooldown, 30 s left/); // logging is outside the cooldown
  assert.throws(() => notifierFactory(() => {}).create(channel, [{ kind: "sms" }]), /unknown notifier layer 'sms'/);
});

/** A brand-new decorator, written here, without touching any existing class. */
class QuietHoursNotifier extends NotifierDecorator {
  constructor(inner: AlertNotifier) {
    super(inner);
  }
  override async notify(a: Alert): Promise<Delivery> {
    const h = a.at.getHours();
    return h >= 23 || h < 6 ? { sent: false, channel: this.channel, detail: "suppressed: quiet hours" } : super.notify(a);
  }
}

test("open for extension: a new decorator is registered and used like the others", async () => {
  const channel = new RecordingChannel();
  const factory = notifierFactory(() => {}).register("quiet", (inner) => new QuietHoursNotifier(inner));
  const n = factory.create(channel, [{ kind: "quiet" }, { kind: "logging" }]);
  const night = { ...alert(), at: new Date(2026, 10, 19, 2, 0, 0) };
  assert.equal((await n.notify(night)).sent, false);
  assert.equal((await n.notify(alert())).sent, true); // 20:33
});

import { test } from "node:test";
import assert from "node:assert/strict";
import type { AlarmControl, CommandResult, Requester } from "../../src/security/patterns/proxy/alarm-control.ts";
import { AuthorizedAlarmControl } from "../../src/security/patterns/proxy/authorized-alarm-control.ts";

const owner: Requester = { id: "111", name: "Daniel" };
const stranger: Requester = { id: "999", name: "X" };

/** A real subject that records every call that reached it. */
class SpyPanel implements AlarmControl {
  readonly calls: string[] = [];
  readonly answer: CommandResult = { ok: true, message: "done" };
  async arm(zone: string, by: Requester) {
    this.calls.push(`arm ${zone} ${by.id}`);
    return this.answer;
  }
  async disarm(zone: string, by: Requester) {
    this.calls.push(`disarm ${zone} ${by.id}`);
    return this.answer;
  }
  async status(by: Requester) {
    this.calls.push(`status ${by.id}`);
    return this.answer;
  }
}

test("the proxy blocks unauthorized requesters before the real panel", async () => {
  const panel = new SpyPanel();
  const audit: string[] = [];
  const proxy: AlarmControl = new AuthorizedAlarmControl(panel, [owner.id], (l) => audit.push(l));
  for (const result of [await proxy.disarm("Curte", stranger), await proxy.arm("", stranger), await proxy.status(stranger)]) {
    assert.deepEqual(result, { ok: false, message: "⛔ Acces refuzat." });
  }
  assert.deepEqual(panel.calls, []);
  assert.deepEqual(audit, ["DENIED disarm for X (999)", "DENIED arm for X (999)", "DENIED status for X (999)"]);
});

test("the proxy passes authorized calls through unchanged", async () => {
  const panel = new SpyPanel();
  const proxy: AlarmControl = new AuthorizedAlarmControl(panel, [owner.id], () => {});
  const result = await proxy.disarm("Curte", owner);
  assert.equal(result, panel.answer); // the very same object
  await proxy.arm("Casă", owner);
  await proxy.status(owner);
  assert.deepEqual(panel.calls, ["disarm Curte 111", "arm Casă 111", "status 111"]);
});

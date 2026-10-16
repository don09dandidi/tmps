import { test } from "node:test";
import assert from "node:assert/strict";
import { RECORDING_CONTROLS, getRecordingControl } from "../src/components/recording/registry.ts";
import { AutoRecordingBadge } from "../src/components/recording/AutoRecordingBadge.tsx";
import { ManualRecordingButton } from "../src/components/recording/ManualRecordingButton.tsx";

test("every recording mode has its own control", () => {
  assert.equal(RECORDING_CONTROLS.auto, AutoRecordingBadge);
  assert.equal(RECORDING_CONTROLS.manual, ManualRecordingButton);
});

test("getRecordingControl resolves registered modes", () => {
  assert.equal(getRecordingControl("auto"), AutoRecordingBadge);
  assert.equal(getRecordingControl("manual"), ManualRecordingButton);
});

test("a stale/unknown mode from localStorage falls back to the manual button instead of crashing", () => {
  assert.equal(getRecordingControl("scheduled"), ManualRecordingButton);
  assert.equal(getRecordingControl(""), ManualRecordingButton);
});

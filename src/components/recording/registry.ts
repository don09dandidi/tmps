import type { ComponentType } from "react";
import type { RecordingMode } from "@/lib/types";
import { AutoRecordingBadge } from "./AutoRecordingBadge";
import { ManualRecordingButton } from "./ManualRecordingButton";
import type { RecordingControlProps } from "./types";

/**
 * OCP: one control per recording mode. Adding a mode means adding its component
 * and one line here — `RecordingControl` and the dashboard stay untouched.
 *
 * Typing this as `Record<RecordingMode, ...>` makes TypeScript fail the build if a
 * mode is added to `RecordingMode` without registering a control for it.
 */
export const RECORDING_CONTROLS: Record<RecordingMode, ComponentType<RecordingControlProps>> = {
  auto: AutoRecordingBadge,
  manual: ManualRecordingButton,
};

/**
 * Cameras are persisted in localStorage, so a stored value can be stale or
 * unknown at runtime. Fall back to the manual button (the previous behaviour for
 * anything that wasn't "auto") instead of crashing the whole grid.
 */
export function getRecordingControl(mode: string): ComponentType<RecordingControlProps> {
  return (
    (RECORDING_CONTROLS as Record<string, ComponentType<RecordingControlProps>>)[mode] ??
    ManualRecordingButton
  );
}

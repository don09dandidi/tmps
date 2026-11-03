import { getRecordingControl } from "@/components/recording/registry";
import type { RecordingControlProps } from "@/components/recording/types";

/** Shows the right recording control for the camera's mode (see recording/registry.ts). */
export function RecordingControl({ camera, onToggle }: RecordingControlProps) {
  const Control = getRecordingControl(camera.recordingMode);
  return <Control camera={camera} onToggle={onToggle} />;
}

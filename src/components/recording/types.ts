import type { Camera } from "@/lib/types";

/** Props every recording control receives, whatever its mode. */
export type RecordingControlProps = {
  camera: Camera;
  onToggle: (id: string) => void;
};

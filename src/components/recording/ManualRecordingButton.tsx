import { Play, Square } from "lucide-react";
import type { RecordingControlProps } from "./types";

/** "manual" mode: the person starts/stops recording with this button. */
export function ManualRecordingButton({ camera, onToggle }: RecordingControlProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle(camera.id);
      }}
      className="flex items-center gap-1.5 rounded-full bg-background/90 px-2 py-1 backdrop-blur transition-colors hover:bg-accent"
    >
      {camera.isRecording ? (
        <>
          <Square className="h-2.5 w-2.5 fill-red-500 text-red-500" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Recording</span>
        </>
      ) : (
        <>
          <Play className="h-2.5 w-2.5 text-muted-foreground" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Start rec
          </span>
        </>
      )}
    </button>
  );
}

import { Circle } from "lucide-react";
import { CameraPlayer } from "@/components/CameraPlayer";
import { RecordingControl } from "@/components/RecordingControl";
import type { Camera } from "@/lib/types";

type CameraModalProps = {
  camera: Camera;
  onClose: () => void;
  onToggleRecording: (id: string) => void;
};

/** SRP: the fullscreen viewer for a single camera. */
export function CameraModal({ camera, onClose, onToggleRecording }: CameraModalProps) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-6 backdrop-blur"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl overflow-hidden rounded-lg border border-border bg-card"
      >
        <div className="relative aspect-video bg-muted">
          <CameraPlayer
            streamUrl={camera.streamUrl}
            isLive={camera.status === "live"}
            placeholderIconClassName="h-12 w-12"
            muted={false}
          />
          <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 backdrop-blur">
            <Circle className="h-2 w-2 fill-red-500 text-red-500" />
            <span className="text-[10px] font-medium uppercase tracking-wider">Live</span>
          </div>
          <div className="absolute right-4 top-4">
            <RecordingControl camera={camera} onToggle={onToggleRecording} />
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-4">
          <div>
            <p className="text-sm font-medium">{camera.name}</p>
            <p className="text-xs text-muted-foreground">{camera.location}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:bg-accent"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

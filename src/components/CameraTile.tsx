import { Circle, Maximize2, WifiOff } from "lucide-react";
import { CameraPlayer } from "@/components/CameraPlayer";
import { RecordingControl } from "@/components/RecordingControl";
import type { Camera } from "@/lib/types";

type CameraTileProps = {
  camera: Camera;
  onOpen: (camera: Camera) => void;
  onToggleRecording: (id: string) => void;
};

/** SRP: one camera card in the dashboard grid. Knows nothing about search, storage or the modal. */
export function CameraTile({ camera, onOpen, onToggleRecording }: CameraTileProps) {
  const isLive = camera.status === "live";

  return (
    <button onClick={() => isLive && onOpen(camera)} className="group text-left">
      <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted">
        <CameraPlayer streamUrl={camera.streamUrl} isLive={isLive} />
        {isLive ? (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-background/90 px-2 py-1 backdrop-blur">
            <Circle className="h-2 w-2 fill-red-500 text-red-500" />
            <span className="text-[10px] font-medium uppercase tracking-wider">Live</span>
          </div>
        ) : (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-background/90 px-2 py-1 backdrop-blur">
            <WifiOff className="h-2.5 w-2.5 text-muted-foreground" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Offline
            </span>
          </div>
        )}
        {isLive && (
          <div className="absolute right-3 top-3">
            <RecordingControl camera={camera} onToggle={onToggleRecording} />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/80 to-transparent p-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-medium">{camera.name}</p>
              <p className="text-xs text-muted-foreground">{camera.location}</p>
            </div>
            <Maximize2 className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </div>
      </div>
    </button>
  );
}

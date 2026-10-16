import { useEffect, useState, type RefObject } from "react";
import { hlsEngine } from "@/lib/video/hls-engine";
import { startPlayback } from "@/lib/video/start-playback";
import type { VideoEngine } from "@/lib/video/video-engine";

/**
 * SRP: React glue only — ties one playback to the component lifecycle and
 * exposes whether it failed. The actual playback logic lives in `startPlayback`
 * and the engine.
 */
export function useVideoStream(
  videoRef: RefObject<HTMLVideoElement | null>,
  streamUrl: string | undefined,
  isLive: boolean,
  engine: VideoEngine = hlsEngine,
) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);

    const video = videoRef.current;
    if (!video || !streamUrl || !isLive) return;

    return startPlayback(engine, video, streamUrl, () => setHasError(true));
  }, [videoRef, streamUrl, isLive, engine]);

  return { hasError, markFailed: () => setHasError(true) };
}

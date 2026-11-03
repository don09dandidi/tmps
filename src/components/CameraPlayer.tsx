import { useRef } from "react";
import { StreamPlaceholder } from "@/components/StreamPlaceholder";
import { useVideoStream } from "@/hooks/use-video-stream";
import type { VideoEngine } from "@/lib/video/video-engine";

type CameraPlayerProps = {
  /**
   * HLS stream URL (e.g. served by go2rtc as `.m3u8`). Leave undefined to
   * show the static placeholder — useful before real cameras are wired up.
   */
  streamUrl?: string;
  /** Whether the camera is currently reachable. */
  isLive: boolean;
  /** Icon size for the placeholder state, in Tailwind px units (h-8/h-12 etc). */
  placeholderIconClassName?: string;
  className?: string;
  /** Muted autoplay is required by browsers for videos to play without a user gesture. */
  muted?: boolean;
  /** Playback backend. Defaults to hls.js; pass another `VideoEngine` to swap it (or fake it in tests). */
  engine?: VideoEngine;
};

/**
 * Renders a live camera feed, or the static placeholder when there's no
 * streamUrl yet, the camera is offline, or playback fails.
 *
 * SRP: this component only decides *what to show*. Starting/stopping playback is
 * `useVideoStream`; the placeholder look is `StreamPlaceholder`.
 * DIP: it depends on the `VideoEngine` abstraction, not on hls.js directly.
 */
export function CameraPlayer({
  streamUrl,
  isLive,
  placeholderIconClassName = "h-8 w-8",
  className = "",
  muted = true,
  engine,
}: CameraPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { hasError, markFailed } = useVideoStream(videoRef, streamUrl, isLive, engine);

  const showPlaceholder = !streamUrl || !isLive || hasError;

  if (showPlaceholder) {
    return (
      <StreamPlaceholder active={isLive && !hasError} iconClassName={placeholderIconClassName} />
    );
  }

  return (
    <video
      ref={videoRef}
      className={`h-full w-full object-cover ${className}`}
      muted={muted}
      autoPlay
      playsInline
      onError={markFailed}
    />
  );
}

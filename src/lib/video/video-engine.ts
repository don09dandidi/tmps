/**
 * DIP: the UI depends on this abstraction, not on hls.js.
 *
 * Anything that can play a stream URL inside a <video> element (hls.js today,
 * WebRTC/MSE later, a fake in tests) implements `VideoEngine`.
 */

export type AttachOptions = {
  /** Aborted when the player is torn down; engines must not touch `video` afterwards. */
  signal: AbortSignal;
  /**
   * Called when playback can no longer continue: unsupported browser, fatal
   * network/media error, or the browser refused to start playback.
   */
  onFatalError: () => void;
};

export interface PlaybackSession {
  /** Stops playback and releases every resource held for the stream. */
  destroy(): void;
}

export interface VideoEngine {
  /**
   * Starts playing `url` in `video`. Resolves to `null` when this engine
   * cannot play on the current device (it has already reported that via
   * `onFatalError`).
   */
  attach(
    video: HTMLVideoElement,
    url: string,
    options: AttachOptions,
  ): Promise<PlaybackSession | null>;
}

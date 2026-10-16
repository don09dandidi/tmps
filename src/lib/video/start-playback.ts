import type { PlaybackSession, VideoEngine } from "./video-engine";

/**
 * SRP: owns the lifecycle of one playback — start, late-arriving results after
 * teardown, and cleanup. Plain TypeScript (no React, no DOM beyond the element
 * handed in), so it can be unit-tested with a fake engine.
 *
 * Returns a `stop` function that is safe to call at any time, including before
 * the engine has finished attaching.
 */
export function startPlayback(
  engine: VideoEngine,
  video: HTMLVideoElement,
  url: string,
  onFatalError: () => void,
): () => void {
  const controller = new AbortController();
  const { signal } = controller;
  let session: PlaybackSession | null = null;

  // Errors that arrive after teardown are noise: the player is already gone.
  const fail = () => {
    if (!signal.aborted) onFatalError();
  };

  engine
    .attach(video, url, { signal, onFatalError: fail })
    .then((created) => {
      if (signal.aborted) {
        created?.destroy();
        return;
      }
      session = created;
    })
    .catch(fail);

  return () => {
    controller.abort();
    session?.destroy();
    session = null;
  };
}

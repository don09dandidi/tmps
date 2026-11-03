import { test } from "node:test";
import assert from "node:assert/strict";
import { startPlayback } from "../src/lib/video/start-playback.ts";
import type { AttachOptions, PlaybackSession, VideoEngine } from "../src/lib/video/video-engine.ts";

const video = {} as HTMLVideoElement;
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Fake engine whose attach() result we control — no hls.js, no DOM (DIP in action). */
function fakeEngine() {
  const calls: { url: string; options: AttachOptions }[] = [];
  let finish!: (session: PlaybackSession | null) => void;
  let fail!: (error: unknown) => void;
  const engine: VideoEngine = {
    attach(_video, url, options) {
      calls.push({ url, options });
      return new Promise((resolve, reject) => {
        finish = resolve;
        fail = reject;
      });
    },
  };
  return {
    engine,
    calls,
    finish: (s: PlaybackSession | null) => finish(s),
    fail: (e: unknown) => fail(e),
  };
}

function fakeSession() {
  let destroyed = 0;
  return {
    session: { destroy: () => destroyed++ } as PlaybackSession,
    destroyedCount: () => destroyed,
  };
}

test("passes the stream url to the engine", () => {
  const f = fakeEngine();
  startPlayback(f.engine, video, "http://go2rtc/api/stream.m3u8?src=camera_01", () => {});
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].url, "http://go2rtc/api/stream.m3u8?src=camera_01");
});

test("stop() after the engine attached destroys the session exactly once", async () => {
  const f = fakeEngine();
  const s = fakeSession();
  const stop = startPlayback(f.engine, video, "u", () => {});
  f.finish(s.session);
  await tick();
  stop();
  stop();
  assert.equal(s.destroyedCount(), 1);
});

test("stop() before the engine finished destroys the late session and aborts the signal", async () => {
  const f = fakeEngine();
  const s = fakeSession();
  const stop = startPlayback(f.engine, video, "u", () => {});
  stop();
  assert.equal(f.calls[0].options.signal.aborted, true);
  f.finish(s.session);
  await tick();
  assert.equal(s.destroyedCount(), 1);
});

test("fatal errors are forwarded while playing, ignored after stop()", async () => {
  const f = fakeEngine();
  let errors = 0;
  const stop = startPlayback(f.engine, video, "u", () => errors++);
  f.calls[0].options.onFatalError();
  assert.equal(errors, 1);
  stop();
  f.calls[0].options.onFatalError();
  assert.equal(errors, 1);
});

test("an engine that cannot play (resolves null) is handled without throwing", async () => {
  const f = fakeEngine();
  const stop = startPlayback(f.engine, video, "u", () => {});
  f.finish(null);
  await tick();
  assert.doesNotThrow(stop);
});

test("if attach() rejects (e.g. hls.js chunk failed to load) the error is reported", async () => {
  const f = fakeEngine();
  let errors = 0;
  startPlayback(f.engine, video, "u", () => errors++);
  f.fail(new Error("chunk load failed"));
  await tick();
  assert.equal(errors, 1);
});

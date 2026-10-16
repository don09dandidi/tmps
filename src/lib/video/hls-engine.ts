import type { VideoEngine } from "./video-engine";

/**
 * hls.js implementation of `VideoEngine` — the only place that knows about hls.js.
 *
 * We deliberately do NOT use Safari's native HLS (<video src="...m3u8">):
 * Safari's native player resolves the relative sub-playlist URI inside
 * go2rtc's master playlist (e.g. "playlist.m3u8") against the *page's*
 * origin instead of the stream's origin, causing 404s. hls.js resolves
 * relative URLs correctly against the manifest URL in every browser, so we
 * use it everywhere for consistent behavior.
 */
export const hlsEngine: VideoEngine = {
  async attach(video, url, { signal, onFatalError }) {
    const { default: Hls } = await import("hls.js");
    if (signal.aborted) return null;

    if (!Hls.isSupported()) {
      onFatalError();
      return null;
    }

    const hls = new Hls({ lowLatencyMode: true });
    hls.loadSource(url);
    hls.attachMedia(video);
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) onFatalError();
    });
    video.play().catch(onFatalError);

    return { destroy: () => hls.destroy() };
  },
};

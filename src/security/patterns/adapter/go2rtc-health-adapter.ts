import { UNKNOWN_HEALTH, type CameraHealth } from "../../domain/camera-health.ts";
import type { CameraHealthSource } from "./camera-health-source.ts";
import type { HttpGet } from "./http.ts";

/**
 * Adaptee: the REST API of go2rtc (third-party, https://github.com/AlexxIT/go2rtc),
 * GET /api/streams. Its answer describes connections, not cameras:
 *   { "camera_01": { "producers": [{ "url": "rtsp://…", "remote_addr": "…",
 *                                     "bytes_recv": 123 }],
 *                    "consumers": [{ "remote_addr": "…" }] }, … }
 * A producer without remote_addr/bytes_recv is configured but not connected
 * (go2rtc connects to a camera only while someone watches it).
 */
interface Go2rtcConnection {
  readonly remote_addr?: string;
  readonly bytes_recv?: number;
}

interface Go2rtcStream {
  readonly producers?: readonly Go2rtcConnection[] | null;
  readonly consumers?: readonly Go2rtcConnection[] | null;
}

/** Adapter: turns go2rtc's stream/connection view into CameraHealth. */
export class Go2rtcHealthAdapter implements CameraHealthSource {
  private readonly endpoint: string;
  private readonly get: HttpGet;

  constructor(baseUrl: string, get: HttpGet) {
    this.endpoint = new URL("/api/streams", baseUrl).toString();
    this.get = get;
  }

  async healthOf(streams: readonly string[]): Promise<ReadonlyMap<string, CameraHealth>> {
    let all: Record<string, Go2rtcStream> = {};
    try {
      const response = await this.get(this.endpoint);
      if (response.status === 200 && response.json && typeof response.json === "object") {
        all = response.json as Record<string, Go2rtcStream>;
      }
    } catch {
      // go2rtc down or unreachable: every camera is "unknown", the caller goes on.
    }
    return new Map(streams.map((name) => [name, Go2rtcHealthAdapter.translate(all[name])]));
  }

  private static translate(stream: Go2rtcStream | undefined): CameraHealth {
    if (!stream) return UNKNOWN_HEALTH;
    const producers = stream.producers ?? [];
    const connected = producers.some((p) => Boolean(p.remote_addr) || (p.bytes_recv ?? 0) > 0);
    return { state: connected ? "live" : "idle", viewers: (stream.consumers ?? []).length };
  }
}

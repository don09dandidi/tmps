import type { Camera, RecordingMode } from "../../lib/types.ts";

/**
 * Builder (creational, from the previous lab): a Camera has an id, a name, a
 * location, a stream URL derived from go2rtc, a recording mode and an
 * enabled flag. The builder assembles it step by step with defaults, validates
 * it once in build() and returns an immutable object.
 */
export class CameraBuilder {
  private id = "";
  private name = "";
  private location = "Neconfigurat";
  private streamUrl: string | undefined = undefined;
  private enabled = true;
  private recordingMode: RecordingMode = "auto";

  withId(id: string): this {
    this.id = id.trim();
    return this;
  }

  named(name: string): this {
    this.name = name.trim();
    return this;
  }

  at(location: string): this {
    this.location = location.trim();
    return this;
  }

  /** Stream served by go2rtc: <base>/api/stream.m3u8?src=<stream>. */
  fromGo2rtc(baseUrl: string, stream: string): this {
    const url = new URL("/api/stream.m3u8", baseUrl);
    url.searchParams.set("src", stream);
    this.streamUrl = url.toString();
    return this;
  }

  recording(mode: RecordingMode): this {
    this.recordingMode = mode;
    return this;
  }

  disabled(): this {
    this.enabled = false;
    return this;
  }

  build(): Camera {
    if (!this.id) throw new Error("a camera needs an id");
    if (!this.name) throw new Error(`camera ${this.id} needs a name`);
    return Object.freeze({
      id: this.id,
      name: this.name,
      location: this.location,
      status: this.enabled ? "live" : "offline",
      streamUrl: this.streamUrl,
      recordingMode: this.recordingMode,
      isRecording: false,
    });
  }
}

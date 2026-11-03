export type RecordingMode = "auto" | "manual";

export type Camera = {
  id: string;
  name: string;
  location: string;
  status: "live" | "offline";
  /**
   * HLS stream URL (e.g. from go2rtc: http://100.x.x.x:1984/api/stream.m3u8?src=cam-01).
   * Leave undefined until real cameras are wired up — the UI falls back to a placeholder.
   */
  streamUrl?: string;
  /**
   * "auto" = motion-triggered recording, controlled by the backend (Frigate/go2rtc).
   * "manual" = person controls recording with the Start/Stop button in the UI.
   */
  recordingMode: RecordingMode;
  /** Only meaningful when recordingMode === "manual". */
  isRecording: boolean;
};

export type NotificationSettings = {
  enabled: boolean;
  onlyWhenAway: boolean;
};

export type RecordingSettings = {
  defaultMode: RecordingMode;
  retentionThresholdGb: number;
};

export type CameraSchedule = {
  /** 24h "HH:mm" format. When both are equal, treat as "always on". */
  activeFrom: string;
  activeTo: string;
  enabled: boolean;
};

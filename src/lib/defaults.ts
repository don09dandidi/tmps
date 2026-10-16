import type { Camera, NotificationSettings, RecordingSettings, CameraSchedule } from "./types";

// go2rtc runs on the VAIO (Tailscale IP 100.69.103.117) and serves each
// Hikvision camera's RTSP feed as HLS at /api/stream.m3u8?src=<name>.
// Rename/re-point these anytime from the Settings page — no code changes needed.
const GO2RTC_BASE = "http://100.69.103.117:1984";

export const DEFAULT_CAMERAS: Camera[] = [
  {
    id: "cam-01",
    name: "Camera 1",
    location: "Neconfigurat",
    status: "live",
    streamUrl: `${GO2RTC_BASE}/api/stream.m3u8?src=camera_01`,
    recordingMode: "auto",
    isRecording: false,
  },
  {
    id: "cam-02",
    name: "Camera 2",
    location: "Neconfigurat",
    status: "live",
    streamUrl: `${GO2RTC_BASE}/api/stream.m3u8?src=camera_02`,
    recordingMode: "auto",
    isRecording: false,
  },
  {
    id: "cam-03",
    name: "Camera 3",
    location: "Neconfigurat",
    status: "live",
    streamUrl: `${GO2RTC_BASE}/api/stream.m3u8?src=camera_03`,
    recordingMode: "auto",
    isRecording: false,
  },
  {
    id: "cam-04",
    name: "Camera 4",
    location: "Neconfigurat",
    status: "live",
    streamUrl: `${GO2RTC_BASE}/api/stream.m3u8?src=camera_04`,
    recordingMode: "auto",
    isRecording: false,
  },
];

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  onlyWhenAway: true,
};

export const DEFAULT_RECORDING_SETTINGS: RecordingSettings = {
  defaultMode: "auto",
  retentionThresholdGb: 150,
};

export const DEFAULT_SCHEDULE: CameraSchedule = {
  activeFrom: "00:00",
  activeTo: "00:00",
  enabled: false,
};

/**
 * Console demo of the structural patterns of the home security system.
 *
 *   npm run demo
 *
 * Offline by default: go2rtc answers with a recorded /api/streams reply and the
 * Telegram API is simulated (the first call fails with 429, to show the retry).
 * With GO2RTC_URL, and TELEGRAM_TOKEN + TELEGRAM_CHAT_ID, it uses the real ones.
 */
import { fetchGet, fetchPost, type HttpGet, type HttpPost } from "../patterns/adapter/http.ts";
import { Go2rtcHealthAdapter } from "../patterns/adapter/go2rtc-health-adapter.ts";
import { TelegramNotifier } from "../patterns/adapter/telegram-notifier.ts";
import type { Requester } from "../patterns/proxy/alarm-control.ts";
import { CommandRouter } from "./command-router.ts";
import { DetectionHandler } from "./detection-handler.ts";
import { alarmControl, ALERT_POLICY, buildProperty, notifierFactory } from "./setup.ts";

const env = process.env;
const GO2RTC = env.GO2RTC_URL ?? "http://127.0.0.1:1984";

/** A real /api/streams reply of go2rtc 1.9 (addresses shortened, passwords removed). */
const RECORDED_STREAMS = {
  camera_01: { producers: [{ url: "rtsp://192.168.1.201:554/Streaming/Channels/101", remote_addr: "192.168.1.201:554", bytes_recv: 8173000000 }], consumers: [{ remote_addr: "127.0.0.1:50122" }] },
  camera_02: { producers: [{ url: "rtsp://192.168.1.202:554/Streaming/Channels/101", remote_addr: "192.168.1.202:554", bytes_recv: 8170000000 }], consumers: [] },
  camera_03: { producers: [{ url: "rtsp://192.168.1.203:554/Streaming/Channels/101" }], consumers: null },
};
const recordedGet: HttpGet = async () => ({ status: 200, json: RECORDED_STREAMS });

let telegramCalls = 0;
const simulatedPost: HttpPost = async (url, body) => {
  telegramCalls++;
  const { chat_id, text } = body as { chat_id: string; text: string };
  console.log(`      [Bot API] POST ${url.replace(/bot[^/]+/, "bot<token>")} chat_id=${chat_id} text="${text}"`);
  return telegramCalls === 1
    ? { status: 429, json: { ok: false, error_code: 429, description: "Too Many Requests: retry after 1" } }
    : { status: 200, json: { ok: true, result: { message_id: telegramCalls } } };
};

function title(text: string) {
  console.log(`\n=== ${text} ${"=".repeat(Math.max(0, 70 - text.length))}`);
}

async function main() {
  title("1. Builder + Composite: cameras and zones");
  const property = buildProperty(GO2RTC);
  const health = new Go2rtcHealthAdapter(GO2RTC, env.GO2RTC_URL ? fetchGet : recordedGet);
  console.log(`Property "${property.name}": ${property.cameraCount()} cameras, ${property.armedCount()} armed`);

  title("2. Proxy -> Panel -> Composite + Adapter(go2rtc): commands");
  const owner: Requester = { id: "111111", name: "Daniel" };
  const stranger: Requester = { id: "999999", name: "Necunoscut" };
  const control = alarmControl(property, health, [owner.id], (line) => console.log(`      [audit] ${line}`));
  const router = new CommandRouter(control);
  for (const [who, text] of [[stranger, "/dezarmeaza"], [owner, "/dezarmeaza Casă"], [owner, "/stare"]] as const) {
    console.log(`> ${who.name}: ${text}`);
    const result = await router.handle(text, who);
    console.log(result.message.split("\n").map((l) => `  ${l}`).join("\n"));
  }

  title("3. Factory + Decorators + Adapter(Telegram): detections");
  const telegram = env.TELEGRAM_TOKEN && env.TELEGRAM_CHAT_ID
    ? new TelegramNotifier(env.TELEGRAM_TOKEN, env.TELEGRAM_CHAT_ID.split(","), fetchPost)
    : new TelegramNotifier("123456:SIMULATED", [owner.id], simulatedPost);
  const notifier = notifierFactory((line) => console.log(`      [log] ${line}`)).create(telegram, ALERT_POLICY);
  const detections = new DetectionHandler(property, notifier);
  for (const [camera, confidence, why] of [
    ["camera_03", 0.81, "zone Casă is disarmed"],
    ["camera_01", 0.87, "armed: first attempt gets 429, retry delivers"],
    ["camera_01", 0.91, "same camera again: cooldown"],
    ["camera_02", 0.64, "another camera: its own cooldown"],
  ] as const) {
    console.log(`> person on ${camera} (${why})`);
    const delivery = await detections.onPersonDetected(camera, confidence);
    console.log(`  => ${delivery.sent ? "SENT" : "not sent"}: ${delivery.detail}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

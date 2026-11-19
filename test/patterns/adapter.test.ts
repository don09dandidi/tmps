import { test } from "node:test";
import assert from "node:assert/strict";
import { Go2rtcHealthAdapter } from "../../src/security/patterns/adapter/go2rtc-health-adapter.ts";
import { TelegramNotifier } from "../../src/security/patterns/adapter/telegram-notifier.ts";
import type { HttpGet, HttpPost } from "../../src/security/patterns/adapter/http.ts";
import { alert } from "./helpers.ts";

test("go2rtc: connections in /api/streams are translated into camera health", async () => {
  const urls: string[] = [];
  const get: HttpGet = async (url) => {
    urls.push(url);
    return {
      status: 200,
      json: {
        camera_01: { producers: [{ remote_addr: "192.168.1.201:554", bytes_recv: 10 }], consumers: [{}, {}] },
        camera_02: { producers: [{ url: "rtsp://192.168.1.202/101" }], consumers: null },
        camera_03: { producers: null, consumers: null },
      },
    };
  };
  const health = await new Go2rtcHealthAdapter("http://127.0.0.1:1984", get).healthOf(["camera_01", "camera_02", "camera_03", "camera_09"]);
  assert.deepEqual(urls, ["http://127.0.0.1:1984/api/streams"]);
  assert.deepEqual(Object.fromEntries(health), {
    camera_01: { state: "live", viewers: 2 },
    camera_02: { state: "idle", viewers: 0 },
    camera_03: { state: "idle", viewers: 0 },
    camera_09: { state: "unknown", viewers: 0 },
  });
});

test("go2rtc down or answering garbage: every camera unknown, no exception", async () => {
  const down: HttpGet = async () => {
    throw new TypeError("fetch failed");
  };
  const garbage: HttpGet = async () => ({ status: 500, json: "Internal Server Error" });
  for (const get of [down, garbage]) {
    const health = await new Go2rtcHealthAdapter("http://g:1984", get).healthOf(["camera_01"]);
    assert.deepEqual(health.get("camera_01"), { state: "unknown", viewers: 0 });
  }
});

test("telegram: one sendMessage per chat, with the alert as text", async () => {
  const calls: Array<[string, unknown]> = [];
  const post: HttpPost = async (url, body) => {
    calls.push([url, body]);
    return { status: 200, json: { ok: true, result: {} } };
  };
  const delivery = await new TelegramNotifier("42:SECRET", ["111", "222"], post).notify(alert("camera_01", 0.87));
  assert.deepEqual(delivery, { sent: true, channel: "telegram", detail: "delivered to 2 chat(s)" });
  assert.equal(calls.length, 2);
  assert.equal(calls[0][0], "https://api.telegram.org/bot42:SECRET/sendMessage");
  assert.deepEqual(calls.map(([, b]) => (b as { chat_id: string }).chat_id), ["111", "222"]);
  assert.match((calls[0][1] as { text: string }).text, /Persoană detectată: camera_01 \(Curte\), 87%, 20:33:00/);
});

test("telegram: an API error becomes a failed delivery and never shows the token", async () => {
  const post: HttpPost = async () => ({ status: 429, json: { ok: false, error_code: 429, description: "Too Many Requests: retry after 5" } });
  const delivery = await new TelegramNotifier("42:SECRET", ["111"], post).notify(alert());
  assert.equal(delivery.sent, false);
  assert.equal(delivery.detail, "chat 111: Too Many Requests: retry after 5");
  assert.doesNotMatch(JSON.stringify(delivery), /SECRET/);
});

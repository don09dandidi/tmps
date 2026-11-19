/** The two HTTP calls the adapters need, injectable so tests and the demo run offline. */
export interface HttpResponse {
  readonly status: number;
  readonly json: unknown;
}

export type HttpGet = (url: string) => Promise<HttpResponse>;
export type HttpPost = (url: string, body: unknown) => Promise<HttpResponse>;

async function toResponse(r: Response): Promise<HttpResponse> {
  return { status: r.status, json: await r.json().catch(() => null) };
}

export const fetchGet: HttpGet = async (url) => toResponse(await fetch(url, { signal: AbortSignal.timeout(5000) }));

export const fetchPost: HttpPost = async (url, body) =>
  toResponse(
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    }),
  );

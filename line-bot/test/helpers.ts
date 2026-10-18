/* テスト用の偽物：KV と fetch */
import type { Env } from "../src/line.ts";

export function fakeEnv(over: Partial<Env> = {}) {
  const kv = new Map<string, string>();
  const DRAFTS = {
    get: async (k: string, type?: string) => {
      const v = kv.get(k);
      return v === undefined ? null : type === "json" ? JSON.parse(v) : v;
    },
    put: async (k: string, v: string) => { kv.set(k, v); },
    delete: async (k: string) => { kv.delete(k); },
  } as unknown as KVNamespace;
  // デフォルトは何も生成しない。メモ自動生成そのものをテストするときは over.AI で差し替える
  const AI = { run: async () => ({ response: "" }) } as unknown as Ai;
  const env: Env = {
    DRAFTS,
    LINE_CHANNEL_SECRET: "secret",
    LINE_CHANNEL_ACCESS_TOKEN: "line-token",
    GITHUB_TOKEN: "gh-token",
    ALLOWED_USER_IDS: "U-me",
    GITHUB_REPO: "owner/repo",
    GITHUB_BRANCH: "master",
    SITE_URL: "https://example.com/",
    AI,
    ...over,
  };
  return { env, kv };
}

type Route = (url: URL, init: RequestInit) => Response | Promise<Response> | undefined;

/** fetch を差し替え、呼ばれた URL と本文を記録する。どのルートにも当たらなければ失敗させる */
export function mockFetch(routes: Route[]) {
  const calls: { url: string; method: string; body?: string }[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    calls.push({ url: url.href, method: init.method ?? "GET", body: init.body as string | undefined });
    for (const r of routes) {
      const res = await r(url, init);
      if (res) return res;
    }
    throw new Error(`unexpected fetch: ${init.method ?? "GET"} ${url.href}`);
  }) as typeof fetch;
  return calls;
}

export const json = (v: unknown, status = 200) => new Response(JSON.stringify(v), { status, headers: { "Content-Type": "application/json" } });

/** LINE の返信 API に送られたメッセージを取り出す */
export const replies = (calls: { url: string; body?: string }[]) =>
  calls.filter((c) => c.url === "https://api.line.me/v2/bot/message/reply").map((c) => JSON.parse(c.body!).messages as {
    text: string; quickReply?: { items: { action: { type: string; label: string; data?: string } }[] };
  }[]);

/** Orientation=6 と GPS 風のタグを持つ、最小の JPEG もどき */
export function sampleJpeg() {
  const exif = [
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, // II, IFD0 は 8
    0x02, 0x00, // 2項目
    0x12, 0x01, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, // Orientation = 6
    0x25, 0x88, 0x04, 0x00, 0x01, 0x00, 0x00, 0x00, 0x47, 0x50, 0x53, 0x21, // GPSInfo（中身は "GPS!"）
    0x00, 0x00, 0x00, 0x00,
  ];
  const seg = (m: number, d: number[]) => [0xff, m, (d.length + 2) >> 8, (d.length + 2) & 0xff, ...d];
  return Uint8Array.from([
    0xff, 0xd8,
    ...seg(0xe0, [0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00]),
    ...seg(0xe1, exif),
    ...seg(0xfe, [0x68, 0x69]), // コメント "hi"
    ...seg(0xdb, [0x00, 1, 2, 3]),
    0xff, 0xda, 0x00, 0x04, 0x01, 0x02, 0x11, 0x22, 0x33, 0xff, 0xd9,
  ]);
}

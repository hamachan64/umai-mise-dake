/* notion-sync.mjs のテスト。Notion API は偽物に差し替えて実行する: npm test */
import { test } from "node:test";
import assert from "node:assert/strict";
import { sync } from "./notion-sync.mjs";

const PROPS = {
  "店名": { type: "title", title: {} },
  "ジャンル": { type: "select", select: { options: [{ name: "パン" }, { name: "居酒屋" }] } },
  "予算": { type: "number", number: {} },
  "推し度": { type: "select", select: { options: [{ name: "★5" }] } },
  "メモ": { type: "rich_text", rich_text: {} },
  "訪問日": { type: "date", date: {} },
};
const shop = (o) => ({ id: "x", name: "x", yomi: "", genre: "パン", area: "a", access: "", budget: 800, dish: "", score: 5, lat: 1, lng: 1, photo: "", memo: "", ...o });
const page = (id, props) => ({ id, properties: {
  "店名": { type: "title", title: [{ plain_text: props.name }] },
  "ジャンル": { type: "select", select: { name: "パン" } },
  "予算": { type: "number", number: 800 },
  "推し度": { type: "select", select: null },
  "メモ": { type: "rich_text", rich_text: [{ plain_text: props.memo ?? "" }] },
  "訪問日": { type: "date", date: props.visited ? { start: props.visited } : null },
} });

async function run(shops, pages, dryRun = false) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ method: init.method, url, body: init.body && JSON.parse(init.body) });
    if (url.endsWith("/databases/db1")) return new Response(JSON.stringify({ properties: PROPS }));
    if (url.endsWith("/query")) return new Response(JSON.stringify({ results: pages, has_more: false }));
    return new Response("{}");
  };
  const logs = [];
  const result = await sync({ token: "t", databaseId: "db1", siteUrl: "https://x/", shops, dryRun, log: (m) => logs.push(m) });
  return { result, calls, logs };
}

test("変わった列だけ更新し、無い店は追加する。知らない選択肢は書かない", async () => {
  const { result, calls, logs } = await run(
    [shop({ name: "ポポー", memo: "新しいメモ" }), shop({ name: "新店", genre: "居酒屋" })],
    [page("p1", { name: "ポポー", memo: "古いメモ" })],
  );
  assert.deepEqual(result, { created: 1, updated: 1 });
  const patch = calls.find((c) => c.method === "PATCH");
  assert.match(patch.url, /\/pages\/p1$/);
  assert.deepEqual(Object.keys(patch.body.properties), ["メモ"]);
  const post = calls.find((c) => c.method === "POST" && c.url.endsWith("/pages"));
  assert.deepEqual(post.body.properties["ジャンル"], { select: { name: "居酒屋" } });
  assert.equal(post.body.properties["推し度"], undefined); // "5" は Notion の選択肢に無い
  assert.ok(logs.some((l) => l.includes("推し度（select）")));
});

test("訪問日：あれば日付として写し、無い店は Notion 側の日付を消さない", async () => {
  const { calls } = await run(
    [shop({ name: "A", visited: "2026-10-01" }), shop({ name: "B" })],
    [page("pa", { name: "A" }), page("pb", { name: "B", visited: "2025-01-01" })],
  );
  const patches = calls.filter((c) => c.method === "PATCH");
  assert.equal(patches.length, 1);
  assert.match(patches[0].url, /\/pages\/pa$/);
  assert.deepEqual(patches[0].body.properties, { "訪問日": { date: { start: "2026-10-01" } } });
});

test("お試しモードでは Notion を書き換えない", async () => {
  const { result, calls } = await run([shop({ name: "新店" })], [], true);
  assert.deepEqual(result, { created: 1, updated: 0 });
  assert.ok(calls.every((c) => c.method !== "PATCH" && !(c.method === "POST" && c.url.endsWith("/pages"))));
});

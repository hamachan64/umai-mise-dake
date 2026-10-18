import { test } from "node:test";
import assert from "node:assert/strict";
import { handleEvent, parseBudget } from "../src/flow.ts";
import { fakeEnv, mockFetch, json, replies, sampleJpeg } from "./helpers.ts";
import type { LineEvent } from "../src/line.ts";

const PLACE = "https://www.google.com/maps/place/%E3%83%9D%E3%83%9D%E3%83%BC/data=!3d35.731601!4d139.765477";
const EXISTING = [{ id: "popo-old", name: "x", yomi: "", genre: "パン", area: "a", access: "", budget: 1, dish: "", score: 3, lat: 1, lng: 1, photo: "", memo: "" }];

const msg = (message: object, userId = "U-me"): LineEvent =>
  ({ type: "message", replyToken: "rt", source: { type: "user", userId }, message: { id: "m1", ...message } as LineEvent["message"] });
const pb = (data: string): LineEvent => ({ type: "postback", replyToken: "rt", source: { type: "user", userId: "U-me" }, postback: { data } });

function routes() {
  let treeBody: any, commitBody: any, patched = 0;
  const calls = mockFetch([
    (u) => u.hostname === "maps.app.goo.gl" ? new Response(null, { status: 302, headers: { Location: PLACE } }) : undefined,
    (u) => u.hostname === "express.heartrails.com" ? json({ response: { station: [{ name: "西日暮里", distance: "130m" }] } }) : undefined,
    (u) => u.hostname === "api.line.me" ? json({}) : undefined,
    (u) => u.hostname === "api-data.line.me" ? new Response(sampleJpeg()) : undefined,
    (u, init) => {
      if (u.hostname !== "api.github.com") return;
      assert.equal((init.headers as Record<string, string>).Authorization, "Bearer gh-token");
      const p = u.pathname.replace("/repos/owner/repo", "");
      if (p === "/git/blobs") return json({ sha: "blob1" });
      if (p === "/git/ref/heads/master") return json({ object: { sha: "head1" } });
      if (p === "/git/commits/head1") return json({ tree: { sha: "tree0" } });
      if (p === "/contents/src/data/shops.json") return new Response(JSON.stringify(EXISTING));
      if (p === "/git/trees") { treeBody = JSON.parse(init.body as string); return json({ sha: "tree1" }); }
      if (p === "/git/commits") { commitBody = JSON.parse(init.body as string); return json({ sha: "commit1" }); }
      if (p === "/git/refs/heads/master" && init.method === "PATCH") { patched++; return json({}); }
    },
  ]);
  return { calls, tree: () => treeBody, commit: () => commitBody, patched: () => patched };
}

const lastReply = (calls: Parameters<typeof replies>[0]) => replies(calls).at(-1)!;
const labels = (m: ReturnType<typeof lastReply>[number]) => m.quickReply?.items.map((i) => i.action.label) ?? [];

test("共有リンク → ボタンと入力 → 写真 → 投稿 までの一連の流れ", async () => {
  const { env, kv } = fakeEnv();
  const r = routes();

  await handleEvent(env, msg({ type: "text", text: "ポポー\nhttps://maps.app.goo.gl/AbC?g_st=il" }));
  let out = lastReply(r.calls);
  assert.match(out[0]!.text, /📍 ポポー\n西日暮里駅 徒歩3分/);
  assert.equal(out[1]!.text, "ジャンルは？");
  assert.equal(labels(out[1]!).length, 12);
  assert.equal(labels(out[1]!).at(-1), "その他 ▶");

  await handleEvent(env, pb("gpage:1"));
  out = lastReply(r.calls);
  assert.equal(labels(out[0]!)[0], "◀ 前へ");
  assert.ok(labels(out[0]!).includes("🥐 パン") || labels(out[0]!).includes("☕ カフェ・喫茶"));

  await handleEvent(env, pb("genre:12"));
  assert.equal(lastReply(r.calls)[0]!.text, "推し度は？");
  await handleEvent(env, pb("score:4"));
  assert.match(lastReply(r.calls)[0]!.text, /予算/);
  await handleEvent(env, msg({ type: "text", text: "８００円" }));
  assert.match(lastReply(r.calls)[0]!.text, /一品/);
  await handleEvent(env, msg({ type: "text", text: "ポパイ" }));
  assert.match(lastReply(r.calls)[0]!.text, /メモ/);
  await handleEvent(env, pb("skip"));
  assert.deepEqual(labels(lastReply(r.calls)[0]!), ["写真を選ぶ", "撮る", "写真なし"]);
  await handleEvent(env, msg({ type: "image" }));
  out = lastReply(r.calls);
  assert.match(out[0]!.text, /店名：ポポー\n場所：西日暮里駅 徒歩3分\nジャンル：パン\n推し度：4 推し\n予算：¥800\n一品：ポパイ\nメモ：—\n写真：あり/);
  assert.ok(kv.has("photo:U-me"));

  await handleEvent(env, pb("publish"));
  assert.match(lastReply(r.calls)[0]!.text, /投稿しました/);
  assert.equal(r.patched(), 1);
  const tree = r.tree();
  assert.equal(tree.base_tree, "tree0");
  const shops = JSON.parse(tree.tree[0].content);
  assert.equal(shops.length, 2);
  assert.ok(shops[1].id.startsWith("shop-"));
  assert.deepEqual({ ...shops[1], id: "" }, {
    id: "", name: "ポポー", yomi: "", genre: "パン", area: "西日暮里", access: "西日暮里駅 徒歩3分", budget: 800,
    dish: "ポパイ", score: 4, lat: 35.731601, lng: 139.765477, photo: `img/${shops[1].id}.jpg`, memo: "",
  });
  assert.deepEqual(tree.tree[1], { path: `public/img/${shops[1].id}.jpg`, mode: "100644", type: "blob", sha: "blob1" });
  assert.equal(r.commit().message, "LINEから追加: ポポー");
  // 写真の中身は位置情報を消したもの
  const blob = r.calls.find((c) => c.url.endsWith("/git/blobs"))!;
  assert.ok(!Buffer.from(JSON.parse(blob.body!).content, "base64").includes(Buffer.from("GPS!")));
  // 下書きは片付いている
  assert.equal(kv.size, 0);

  // 連打されても二回目は下書きが無いので投稿されない
  await handleEvent(env, pb("publish"));
  assert.equal(r.patched(), 1);
});

test("段階に合わないボタンや範囲外の値は受け付けない", async () => {
  const { env, kv } = fakeEnv();
  const r = routes();
  await handleEvent(env, msg({ type: "text", text: "https://maps.app.goo.gl/AbC" }));
  for (const bad of ["score:5", "genre:99", "genre:", "genre:1.5", "publish", "budget:800"]) {
    await handleEvent(env, pb(bad));
    assert.match(lastReply(r.calls)[0]!.text, /今は使えません/, bad);
  }
  assert.equal(JSON.parse(kv.get("draft:U-me")!).step, "genre");
  await handleEvent(env, pb("genre:0"));
  await handleEvent(env, pb("score:9"));
  assert.equal(JSON.parse(kv.get("draft:U-me")!).step, "score");
  // 途中で写真を送られても受け付けない
  await handleEvent(env, msg({ type: "image" }));
  assert.match(lastReply(r.calls)[0]!.text, /写真は最後に/);
  assert.ok(!kv.has("photo:U-me"));
});

test("場所が取れなければ位置情報を聞き、店名も無ければ先に店名を聞く", async () => {
  const { env, kv } = fakeEnv();
  const r = mockFetch([
    (u) => u.hostname === "maps.app.goo.gl" ? new Response(null, { status: 404 }) : undefined,
    (u) => u.hostname === "express.heartrails.com" ? json({ response: { station: [{ name: "日暮里", distance: "700m" }] } }) : undefined,
    (u) => u.hostname === "api.line.me" ? json({}) : undefined,
  ]);
  await handleEvent(env, msg({ type: "text", text: "https://maps.app.goo.gl/AbC" }));
  assert.equal(lastReply(r).at(-1)!.text, "店名を送ってください。");
  await handleEvent(env, msg({ type: "text", text: "Think" }));
  const out = lastReply(r)[0]!;
  assert.match(out.text, /場所が分かりませんでした/);
  assert.equal(out.quickReply!.items[0]!.action.type, "location");
  await handleEvent(env, msg({ type: "location", latitude: 35.7224, longitude: 139.771, address: "x" }));
  assert.match(lastReply(r)[0]!.text, /日暮里駅 徒歩11分/);
  assert.equal(lastReply(r)[1]!.text, "ジャンルは？");
  assert.equal(JSON.parse(kv.get("draft:U-me")!).name, "Think");
});

test("許可していない人には何も返さない。許可リストが空のときだけ自分のIDを返す", async () => {
  const a = fakeEnv();
  const r = routes();
  await handleEvent(a.env, msg({ type: "text", text: "https://maps.app.goo.gl/AbC" }, "U-stranger"));
  assert.equal(r.calls.length, 0);
  assert.equal(a.kv.size, 0);

  const b = fakeEnv({ ALLOWED_USER_IDS: "" });
  await handleEvent(b.env, msg({ type: "text", text: "hi" }, "U-new"));
  assert.match(lastReply(r.calls)[0]!.text, /U-new/);
  assert.equal(b.kv.size, 0);
});

test("LINE の再送は処理しない", async () => {
  const { env } = fakeEnv();
  const r = routes();
  await handleEvent(env, { ...msg({ type: "text", text: "使い方" }), deliveryContext: { isRedelivery: true } });
  assert.equal(r.calls.length, 0);
});

test("予算の文字入力", () => {
  assert.equal(parseBudget("1,200円"), 1200);
  assert.equal(parseBudget("１２００"), 1200);
  assert.equal(parseBudget("¥3000"), 3000);
  assert.equal(parseBudget("安い"), null);
  assert.equal(parseBudget("0"), null);
});

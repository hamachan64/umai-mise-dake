import { test } from "node:test";
import assert from "node:assert/strict";
import { findMapsUrl, parseMapsUrl, resolvePlace, nearestStation } from "../src/maps.ts";
import { mockFetch, json } from "./helpers.ts";

test("共有の文面から Googleマップのリンクだけを拾う", () => {
  assert.equal(findMapsUrl("ポポー\nhttps://maps.app.goo.gl/AbC123?g_st=il")?.hostname, "maps.app.goo.gl");
  assert.equal(findMapsUrl("https://www.google.com/maps/place/x")?.pathname, "/maps/place/x");
  assert.equal(findMapsUrl("https://example.com/maps/place/x"), null);
  assert.equal(findMapsUrl("https://goo.gl/xyz"), null);
  assert.equal(findMapsUrl("https://www.google.com/search?q=x"), null);
  assert.equal(findMapsUrl("http://maps.app.goo.gl/x"), null);
});

test("place URL は店名と !3d!4d の座標を読む（@ は画面中心なので使わない）", () => {
  const p = parseMapsUrl(new URL("https://www.google.com/maps/place/%E3%83%9D%E3%83%9D%E3%83%BC/@35.7,139.7,17z/data=!4m6!3m5!1s0x0:0x0!8m2!3d35.731601!4d139.765477!16s"));
  assert.deepEqual(p, { name: "ポポー", lat: 35.731601, lng: 139.765477 });
});

test("@ しか無ければ @ の座標", () => {
  const p = parseMapsUrl(new URL("https://www.google.com/maps/place/Think/@35.722399,139.771017,17z"));
  assert.deepEqual(p, { name: "Think", lat: 35.722399, lng: 139.771017 });
});

test("?q=店名, 住所 の形", () => {
  const p = parseMapsUrl(new URL("https://maps.google.com/?q=%E3%83%9D%E3%83%9D%E3%83%BC,+%E3%80%92116-0013+%E6%9D%B1%E4%BA%AC%E9%83%BD%E8%8D%92%E5%B7%9D%E5%8C%BA&ftid=0x1:0x2"));
  assert.deepEqual(p, { name: "ポポー", address: "〒116-0013 東京都荒川区" });
  assert.deepEqual(parseMapsUrl(new URL("https://maps.google.com/?q=35.1,139.2")), { lat: 35.1, lng: 139.2 });
});

test("短縮リンクを辿り、座標が無ければ住所から国土地理院で引く", async () => {
  const calls = mockFetch([
    (u) => u.hostname === "maps.app.goo.gl" ? new Response(null, { status: 302, headers: { Location: "https://maps.google.com/?q=%E3%83%9D%E3%83%9D%E3%83%BC,+%E3%80%92116-0013+%E6%9D%B1%E4%BA%AC%E9%83%BD%E8%8D%92%E5%B7%9D%E5%8C%BA%E8%A5%BF%E6%97%A5%E6%9A%AE%E9%87%8C%EF%BC%95%E2%88%92%EF%BC%91%EF%BC%94&ftid=0x1:0x2" } }) : undefined,
    (u) => u.hostname === "msearch.gsi.go.jp" ? json([{ geometry: { coordinates: [139.7654, 35.7316] } }]) : undefined,
  ]);
  const p = await resolvePlace("https://maps.app.goo.gl/AbC");
  assert.equal(p?.name, "ポポー");
  assert.equal(p?.lat, 35.7316);
  assert.equal(p?.lng, 139.7654);
  // 全角数字・全角ハイフンは直し、郵便番号は外して検索する
  assert.equal(new URL(calls.at(-1)!.url).searchParams.get("q"), "東京都荒川区西日暮里5-14");
});

test("Google 以外への転送は辿らない。そのときは文面の1行目を店名にする", async () => {
  const calls = mockFetch([
    (u) => u.hostname === "maps.app.goo.gl" ? new Response(null, { status: 302, headers: { Location: "https://evil.example/" } }) : undefined,
  ]);
  const p = await resolvePlace("ポポー\nhttps://maps.app.goo.gl/AbC");
  assert.deepEqual(p, { name: "ポポー" });
  assert.equal(calls.length, 1);
});

test("同意画面を挟んでも continue の行き先を読む", async () => {
  mockFetch([
    (u) => u.hostname === "maps.app.goo.gl"
      ? new Response(null, { status: 302, headers: { Location: "https://consent.google.com/m?continue=" + encodeURIComponent("https://www.google.com/maps/place/Think/data=!3d35.72!4d139.77") } })
      : undefined,
  ]);
  assert.deepEqual(await resolvePlace("https://maps.app.goo.gl/AbC"), { name: "Think", lat: 35.72, lng: 139.77 });
});

test("最寄り駅と徒歩分数", async () => {
  mockFetch([(u) => u.hostname === "express.heartrails.com" ? json({ response: { station: [{ name: "西日暮里", distance: "130m" }] } }) : undefined]);
  assert.deepEqual(await nearestStation(35.73, 139.76), { area: "西日暮里", access: "西日暮里駅 徒歩3分" });
  mockFetch([(u) => u.hostname === "express.heartrails.com" ? json({ response: { error: "x" } }) : undefined]);
  assert.equal(await nearestStation(0, 0), null);
});

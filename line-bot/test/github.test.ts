import { test } from "node:test";
import assert from "node:assert/strict";
import { makeId, makeYomi, formatShops } from "../src/github.ts";

test("id：英字の店名はそれを、日本語なら日付（日本時間）から作り、重複は避ける", () => {
  const now = new Date("2026-10-18T16:00:00Z"); // 日本時間では 19日
  assert.equal(makeId("Parklet", new Set(), now), "parklet");
  assert.equal(makeId("I'm donut？池袋", new Set(), now), "i-m-donut");
  assert.equal(makeId("ポポー", new Set(), now), "shop-20261019");
  assert.equal(makeId("ポポー", new Set(["shop-20261019", "shop-20261019-2"]), now), "shop-20261019-3");
  assert.match(makeId("A".repeat(50), new Set()), /^[a-z0-9-]+$/);
});

test("読み：英字の店名だけ大文字で", () => {
  assert.equal(makeYomi("Ramen Jazzy Beats"), "RAMEN JAZZY BEATS");
  assert.equal(makeYomi("flour+water"), "FLOUR WATER");
  assert.equal(makeYomi("ポポー"), "");
});

test("1店1行で書き出す", () => {
  const s = formatShops([{ id: "a" } as never, { id: "b" } as never]);
  assert.equal(s, '[\n  {"id":"a"},\n  {"id":"b"}\n]\n');
});

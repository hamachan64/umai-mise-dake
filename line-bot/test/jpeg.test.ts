import { test } from "node:test";
import assert from "node:assert/strict";
import { stripJpegMetadata, toBase64 } from "../src/jpeg.ts";
import { sampleJpeg } from "./helpers.ts";

const has = (b: Uint8Array, s: string) => Buffer.from(b).includes(Buffer.from(s, "latin1"));

test("Exif の位置情報とコメントは消え、向きだけ残る", () => {
  const src = sampleJpeg();
  assert.ok(has(src, "GPS!"));
  const out = stripJpegMetadata(src)!;
  assert.ok(out);
  assert.ok(!has(out, "GPS!"));
  assert.ok(!has(out, "hi\xff"));
  assert.ok(has(out, "JFIF"));
  // 付け直した最小の Exif（ビッグエンディアン）に Orientation=6
  const i = Buffer.from(out).indexOf(Buffer.from([0x01, 0x12, 0x00, 0x03]));
  assert.ok(i > 0);
  assert.equal(out[i + 9], 6);
  // 画像データ（SOS 以降）はそのまま
  assert.deepEqual([...out.subarray(-11)], [...src.subarray(-11)]);
});

test("JPEG 以外や壊れたファイルは受け付けない", () => {
  assert.equal(stripJpegMetadata(Uint8Array.from([0x89, 0x50, 0x4e, 0x47])), null);
  assert.equal(stripJpegMetadata(Uint8Array.from([0xff, 0xd8, 0xff, 0xe1, 0x40, 0x00])), null);
});

test("base64 は Buffer と同じ結果", () => {
  const b = new Uint8Array(100_000).map((_, i) => (i * 7) & 0xff);
  assert.equal(toBase64(b), Buffer.from(b).toString("base64"));
});

/* 写真のメタデータ（撮影位置・機種など）を消す。
   向き（Orientation）だけは消すと写真が横倒しになるので、それだけ残した最小の Exif を付け直す */

const MAX_BYTES = 5 * 1024 * 1024;

export function stripJpegMetadata(b: Uint8Array): Uint8Array | null {
  if (b.length > MAX_BYTES || b[0] !== 0xff || b[1] !== 0xd8) return null;
  const parts: Uint8Array[] = [b.subarray(0, 2)];
  let orientation: number | undefined;
  let i = 2;
  for (;;) {
    if (i + 2 > b.length || b[i] !== 0xff) return null;
    const m = b[i + 1]!;
    if (m === 0xff) { i++; continue; }
    // SOS 以降は画像データそのもの。EOI まで丸ごと残す
    if (m === 0xda || m === 0xd9) { parts.push(b.subarray(i)); break; }
    if ((m >= 0xd0 && m <= 0xd7) || m === 0x01) { parts.push(b.subarray(i, i + 2)); i += 2; continue; }
    if (i + 4 > b.length) return null;
    const end = i + 2 + ((b[i + 2]! << 8) | b[i + 3]!);
    if (end > b.length) return null;
    const seg = b.subarray(i, end);
    if (m === 0xe1) orientation ??= readOrientation(seg.subarray(4));
    // 残すのは APP0(JFIF)・APP2(ICC 色プロファイル)・APP14(Adobe) と画像の構造そのもの。
    // APP1(Exif/XMP)・そのほかの APPn・コメントは捨てる
    const drop = (m >= 0xe1 && m <= 0xef && m !== 0xe2 && m !== 0xee) || m === 0xfe;
    if (!drop) parts.push(seg);
    i = end;
  }
  if (orientation && orientation !== 1) parts.splice(1, 0, orientationApp1(orientation));
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

function readOrientation(d: Uint8Array): number | undefined {
  // "Exif\0\0" のあとに TIFF ヘッダ → IFD0
  if (d.length < 14 || String.fromCharCode(...d.subarray(0, 4)) !== "Exif") return;
  const t = d.subarray(6);
  const le = t[0] === 0x49; // "II" = リトルエンディアン、"MM" = ビッグエンディアン
  const u16 = (o: number) => (o + 2 > t.length ? -1 : le ? t[o]! | (t[o + 1]! << 8) : (t[o]! << 8) | t[o + 1]!);
  const u32 = (o: number) => (o + 4 > t.length ? -1 : le
    ? (t[o]! | (t[o + 1]! << 8) | (t[o + 2]! << 16)) + t[o + 3]! * 2 ** 24
    : t[o]! * 2 ** 24 + ((t[o + 1]! << 16) | (t[o + 2]! << 8) | t[o + 3]!));
  const ifd = u32(4);
  const count = u16(ifd);
  for (let k = 0; ifd >= 0 && k < count; k++) {
    const e = ifd + 2 + k * 12;
    if (u16(e) === 0x0112) {
      const v = u16(e + 8);
      return v >= 1 && v <= 8 ? v : undefined;
    }
  }
}

function orientationApp1(v: number) {
  // FF E1 + 長さ + "Exif\0\0" + TIFF(MM) + IFD0 に Orientation の1項目だけ
  return Uint8Array.from([
    0xff, 0xe1, 0x00, 0x22,
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
    0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08,
    0x00, 0x01,
    0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, v, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
  ]);
}

export function toBase64(b: Uint8Array) {
  let s = "";
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}

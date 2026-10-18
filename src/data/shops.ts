/* =====================================================================
   お店データの読み込み口。データ本体は shops.json にあります。

   - 普段の追加は LINE Bot から（line-bot/README.md）。Bot が shops.json に1行足してコミットします
   - 手で直すときも shops.json を編集。1店＝1行です
   - budget は「ひとりあたりの目安（円）」を数値で。表示と絞り込みに使います
   - lat / lng は地図ページのピン位置。Googleマップで店を右クリック →
     いちばん上に出る座標をコピーして貼るのが早いです
   - photo に画像パス（例 "img/marutama.jpg" を public/ に置く）を入れると
     カードのビジュアルが写真に差し替わります。空ならジャンルの漢字
   - visited は訪問日（"2026-10-18"）。省略可。サイトには出さず Notion にだけ写します
   - ジャンルと推し度の選択肢は choices.ts
   ===================================================================== */

import data from "./shops.json";
import { GENRES, SCORE_LABEL, type Genre, type Score } from "./choices";

export { GENRES, SCORE_LABEL, SCORE_MAX, type Genre } from "./choices";

export type Shop = {
  id: string;
  name: string;
  yomi: string;
  genre: Genre;
  area: string;
  access: string;
  budget: number;
  dish: string;
  score: Score;
  lat: number;
  lng: number;
  photo: string;
  memo: string;
  /** 訪問日（YYYY-MM-DD）。サイトには出さず、Notion への同期だけに使う */
  visited?: string;
};

/** JSON は型が緩いので、ビルド時に中身を確かめる。おかしな行があればビルドを止めて公開させない */
function validate(rows: unknown[]): Shop[] {
  const seen = new Set<string>();
  return rows.map((r, i) => {
    const s = r as Shop;
    const where = `shops.json の ${i + 1} 件目（${s?.name ?? "?"}）`;
    const fail = (why: string) => { throw new Error(`${where}: ${why}`); };
    if (typeof s?.id !== "string" || !/^[a-z0-9-]+$/.test(s.id)) fail("id は英小文字・数字・ハイフンのみ");
    if (seen.has(s.id)) fail(`id「${s.id}」が重複しています`);
    seen.add(s.id);
    for (const k of ["name", "yomi", "area", "access", "dish", "photo", "memo"] as const) {
      if (typeof s[k] !== "string") fail(`${k} が文字列ではありません`);
    }
    if (!s.name) fail("name が空です");
    if (!(s.genre in GENRES)) fail(`ジャンル「${s.genre}」が choices.ts にありません`);
    if (!(s.score in SCORE_LABEL)) fail("score は 1〜5 の整数");
    for (const k of ["budget", "lat", "lng"] as const) {
      if (typeof s[k] !== "number" || !Number.isFinite(s[k])) fail(`${k} が数値ではありません`);
    }
    if (s.photo && !/^img\/[a-z0-9-]+\.jpg$/.test(s.photo)) fail("photo は img/〇〇.jpg の形で");
    if (s.visited !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(s.visited)) fail("visited は 2026-10-18 の形で");
    return s;
  });
}

export const SHOPS: Shop[] = validate(data);

/* ---- 以下は SHOPS から自動で導出されるもの。触らなくて大丈夫です ---- */

export const GENRE_LIST = [...new Set(SHOPS.map((s) => s.genre))];
export const AREA_LIST  = [...new Set(SHOPS.map((s) => s.area))];

export const iconOf  = (g: string) => GENRES[g as Genre]?.icon ?? "🍽";
export const onomaOf = (g: string) => GENRES[g as Genre]?.o ?? "うまい";
export const kanjiOf = (g: string) => GENRES[g as Genre]?.k ?? "旨";
export type Tone = "shu" | "ai" | "matcha" | "karashi";
export const toneOf  = (g: string): Tone => (GENRES[g as Genre]?.tone as Tone) ?? "shu";

/** 掲載番号（No.001〜）。SHOPS の並び順で振る */
export const noOf = (id: string) =>
  String(SHOPS.findIndex((s) => s.id === id) + 1).padStart(3, "0");

/** 1200 → 「千二百円」。短冊メニュー用の漢数字 */
export const kansuji = (n: number) => {
  const d = "〇一二三四五六七八九";
  const under = (x: number) => {
    let s = "";
    for (const [v, u] of [[1000, "千"], [100, "百"], [10, "十"]] as const) {
      const q = Math.floor(x / v); x %= v;
      if (q) s += (q > 1 ? d[q] : "") + u;
    }
    return s + (x ? d[x] : "");
  };
  const man = Math.floor(n / 10000), rest = n % 10000;
  return (man ? under(man) + "万" : "") + under(rest) + "円";
};

/** 予算帯。詳細検索の絞り込みに使います */
export const BUDGET_BANDS = [
  { id: "b1", label: "〜2,000円",       min: 0,     max: 2000 },
  { id: "b2", label: "2,000〜5,000円",  min: 2000,  max: 5000 },
  { id: "b3", label: "5,000〜10,000円", min: 5000,  max: 10000 },
  { id: "b4", label: "10,000円〜",      min: 10000, max: Infinity },
] as const;

export const scoreLabel = (n: number) => SCORE_LABEL[n as keyof typeof SCORE_LABEL] ?? "";

export const yen = (n: number) => "¥" + n.toLocaleString("ja-JP");

export const bandOf = (budget: number) =>
  BUDGET_BANDS.find((b) => budget >= b.min && budget < b.max)?.id ?? "b4";

export const mapsUrl = (s: Shop) =>
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent(`${s.name} ${s.area}`);

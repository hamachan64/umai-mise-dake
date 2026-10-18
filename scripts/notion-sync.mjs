/* =====================================================================
   shops.json（正本）→ Notion「グルメリスト」DB へ一方向にコピーする。
   GitHub Actions（.github/workflows/notion-sync.yml）から、shops.json が変わるたびに動きます。

   - Notion の列は「名前」と「種類」で自動的に対応づけます（下の COLUMNS）。
     見つからない列・種類が合わない列は飛ばしてログに出すだけなので、Notion 側を壊しません
   - 店の対応づけは「サイトID」列があればそれで、無ければ店名で行います
   - サイトから消した店は Notion からは消しません（誤操作で消えないように）
   - Notion で直接直した内容は、次に同じ店が更新されたときにサイト側の値で上書きされます

   手元で試す: NOTION_TOKEN=… NOTION_DATABASE_ID=… DRY_RUN=1 node scripts/notion-sync.mjs
   ===================================================================== */

import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

/** サイトの項目 → Notion の列名の候補（上から順に探す）。列名が違うときはここに足してください */
export const COLUMNS = {
  name:   ["店名", "名前", "Name"],
  siteId: ["サイトID"],
  genre:  ["ジャンル"],
  area:   ["エリア", "地域", "最寄り駅"],
  access: ["アクセス"],
  budget: ["予算"],
  dish:   ["おすすめ", "一品", "おすすめメニュー", "料理"],
  score:  ["推し度", "おすすめ度", "評価", "スコア"],
  memo:   ["メモ", "コメント", "感想"],
  photo:  ["写真", "画像"],
  map:    ["Googleマップ", "地図", "URL"],
  lat:    ["緯度"],
  lng:    ["経度"],
};

const NOTION = "https://api.notion.com/v1";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s ?? "").normalize("NFKC").replace(/\s+/g, " ").trim();

function client(token) {
  return async function notion(path, method = "GET", body) {
    for (let attempt = 0; ; attempt++) {
      const res = await fetch(NOTION + path, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
        body: body && JSON.stringify(body),
      });
      // 混んでいるときは待ってやり直す（Notion の上限は平均 3回/秒）
      if (res.status === 429 && attempt < 5) { await sleep(Number(res.headers.get("retry-after") ?? 1) * 1000); continue; }
      if (!res.ok) throw new Error(`Notion ${method} ${path}: ${res.status} ${await res.text()}`);
      return res.json();
    }
  };
}

/** Notion DB の列を、サイトの項目ごとに {名前, 種類} で引けるようにする */
export function mapColumns(props) {
  const cols = {};
  for (const [field, names] of Object.entries(COLUMNS)) {
    const hit = field === "name"
      ? Object.entries(props).find(([, p]) => p.type === "title")
      : names.map((n) => [n, props[n]]).find(([, p]) => p);
    if (hit) cols[field] = { name: hit[0], type: hit[1].type, options: (hit[1][hit[1].type]?.options ?? []).map((o) => o.name) };
  }
  return cols;
}

/** サイトの値を Notion の列の種類に合わせて変換する。合わなければ undefined（＝その列は書かない） */
export function toProp(col, value) {
  if (value === undefined || value === null) return undefined;
  const str = String(value);
  switch (col.type) {
    case "title":     return { title: str ? [{ text: { content: str.slice(0, 2000) } }] : [] };
    case "rich_text": return { rich_text: str ? [{ text: { content: str.slice(0, 2000) } }] : [] };
    case "number":    return typeof value === "number" ? { number: value } : undefined;
    case "url":       return { url: str || null };
    // 選択肢は Notion に既にあるものだけ使う（知らない選択肢を勝手に増やさない）
    case "select":       return col.options.includes(str) ? { select: { name: str } } : undefined;
    case "multi_select": return col.options.includes(str) ? { multi_select: [{ name: str }] } : undefined;
    case "files":     return { files: str ? [{ name: str.split("/").pop().slice(0, 100), type: "external", external: { url: str } }] : [] };
    default:          return undefined;
  }
}

/** Notion のページから、比較用に値だけを取り出す */
export function fromProp(p) {
  if (!p) return undefined;
  switch (p.type) {
    case "title": case "rich_text": return p[p.type].map((t) => t.plain_text ?? t.text?.content ?? "").join("");
    case "number": return p.number;
    case "url": return p.url ?? "";
    case "select": return p.select?.name ?? "";
    case "multi_select": return p.multi_select.map((o) => o.name).join(",");
    case "files": return p.files.map((f) => f.external?.url ?? f.file?.url ?? "").join(",");
    default: return undefined;
  }
}

export function siteValues(shop, siteUrl) {
  const base = siteUrl.replace(/\/?$/, "/");
  return {
    name: shop.name, siteId: shop.id, genre: shop.genre, area: shop.area, access: shop.access,
    budget: shop.budget, dish: shop.dish, score: shop.score, memo: shop.memo,
    photo: shop.photo ? base + shop.photo : "",
    map: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`${shop.name} ${shop.area}`),
    lat: shop.lat, lng: shop.lng,
  };
}

/** 1店ぶんの「書き換えが必要な列」だけを返す */
export function diffProps(cols, shop, page, siteUrl, skipped) {
  const want = siteValues(shop, siteUrl);
  const out = {};
  for (const [field, col] of Object.entries(cols)) {
    const prop = toProp(col, want[field]);
    if (!prop) { skipped.add(`${col.name}（${col.type}）`); continue; }
    const now = fromProp(page?.properties?.[col.name]);
    const next = fromProp({ type: col.type, ...prop });
    if (!page || norm(now) !== norm(next)) out[col.name] = prop;
  }
  return out;
}

export async function sync({ token, databaseId, siteUrl, shops, dryRun = false, log = console.log }) {
  const notion = client(token);
  const db = await notion(`/databases/${databaseId}`);
  const cols = mapColumns(db.properties);
  log("列の対応: " + Object.entries(cols).map(([f, c]) => `${f}→${c.name}(${c.type})`).join(", "));
  const missing = Object.keys(COLUMNS).filter((f) => !cols[f]);
  if (missing.length) log("Notion に見つからない項目（書きません）: " + missing.join(", "));

  const pages = [];
  for (let cursor; ;) {
    const r = await notion(`/databases/${databaseId}/query`, "POST", { page_size: 100, ...(cursor && { start_cursor: cursor }) });
    pages.push(...r.results);
    if (!r.has_more) break;
    cursor = r.next_cursor;
  }
  const byId = new Map(), byName = new Map();
  for (const p of pages) {
    const id = cols.siteId && fromProp(p.properties[cols.siteId.name]);
    if (id) byId.set(id, p);
    const name = norm(fromProp(p.properties[cols.name.name]));
    if (name && !byName.has(name)) byName.set(name, p);
  }

  const skipped = new Set();
  let created = 0, updated = 0;
  for (const shop of shops) {
    const page = byId.get(shop.id) ?? byName.get(norm(shop.name));
    const props = diffProps(cols, shop, page, siteUrl, skipped);
    if (!Object.keys(props).length) continue;
    if (page) {
      log(`更新: ${shop.name}（${Object.keys(props).join(", ")}）`);
      if (!dryRun) await notion(`/pages/${page.id}`, "PATCH", { properties: props });
      updated++;
    } else {
      log(`追加: ${shop.name}`);
      if (!dryRun) await notion("/pages", "POST", { parent: { database_id: databaseId }, properties: props });
      created++;
    }
    if (!dryRun) await sleep(350);
  }
  if (skipped.size) log("種類が合わない・選択肢に無い値があって書かなかった列: " + [...skipped].join(", "));
  log(`${dryRun ? "【お試し】" : ""}追加 ${created} 件・更新 ${updated} 件・変更なし ${shops.length - created - updated} 件`);
  return { created, updated };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const { NOTION_TOKEN, NOTION_DATABASE_ID, SITE_URL = "https://hamachan64.github.io/umai-mise-dake/", DRY_RUN } = process.env;
  if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
    console.log("NOTION_TOKEN / NOTION_DATABASE_ID が未設定なので、Notion への同期は飛ばします");
    process.exit(0);
  }
  const shops = JSON.parse(await readFile(new URL("../src/data/shops.json", import.meta.url), "utf8"));
  // DB の URL ごと貼られても ID 部分（32桁、またはハイフン区切りの UUID）だけを使う
  const databaseId = NOTION_DATABASE_ID.match(/(?<![0-9a-f])(?:[0-9a-f]{32}|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})(?![0-9a-f])/i)?.[0] ?? NOTION_DATABASE_ID;
  await sync({ token: NOTION_TOKEN, databaseId, siteUrl: SITE_URL, shops, dryRun: DRY_RUN === "1" || DRY_RUN === "true" });
}

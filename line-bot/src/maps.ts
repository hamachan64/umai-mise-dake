/* Googleマップの共有リンク → 店名・座標・最寄り駅。どれも APIキー不要・無料のものだけを使う
   - 共有リンクは転送先URLに店名と座標が入っていることが多いので、それを読む
   - 座標が無ければ住所から国土地理院の住所検索で出す
   - 最寄り駅は HeartRails Express */

export type Place = { name?: string; address?: string; lat?: number; lng?: number };

const SHORT_HOSTS = new Set(["maps.app.goo.gl", "goo.gl"]);
const GOOGLE_HOST = /^(?:www\.|maps\.)?google\.(?:com|co\.jp)$/;

/** 取りに行ってよい URL か。任意の URL を Worker に取得させないよう Google のものだけに絞る */
const isGoogle = (u: URL) => u.protocol === "https:" && (SHORT_HOSTS.has(u.hostname) || GOOGLE_HOST.test(u.hostname));
const isMapsPage = (u: URL) => GOOGLE_HOST.test(u.hostname) && (u.hostname.startsWith("maps.") || u.pathname.startsWith("/maps"));
const isMapsLink = (u: URL) =>
  u.protocol === "https:" && (u.hostname === "maps.app.goo.gl" || (u.hostname === "goo.gl" && u.pathname.startsWith("/maps")) || isMapsPage(u));

export function findMapsUrl(text: string): URL | null {
  for (const m of text.matchAll(/https?:\/\/[^\s<>"]+/g)) {
    try {
      const u = new URL(m[0]);
      if (isMapsLink(u)) return u;
    } catch { /* URL でなければ次へ */ }
  }
  return null;
}

const coord = (lat: string | number, lng: string | number) => {
  const a = Number(lat), b = Number(lng);
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180 && (a || b) ? { lat: a, lng: b } : {};
};

const decode = (s: string) => {
  try { return decodeURIComponent(s.replace(/\+/g, " ")).trim(); } catch { return s.trim(); }
};

/** Googleマップの長いURLから読めるものを読む */
export function parseMapsUrl(u: URL): Place {
  const p: Place = {};
  const place = u.pathname.match(/\/maps\/place\/([^/]+)/);
  if (place) {
    // 店名の後ろに「,住所」が続くURLがあるので、?q= と同じく先頭だけを店名にする
    const [head, ...rest] = decode(place[1]!).split(/[,，、]\s*/);
    p.name = head?.trim();
    if (rest.length) p.address = rest.join(" ").trim();
  }

  // data=…!3d緯度!4d経度 が店そのものの座標。@緯度,経度 は画面の中心なので次点
  const pins = [...u.href.matchAll(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/g)];
  const at = u.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  const last = pins.at(-1);
  if (last) Object.assign(p, coord(last[1]!, last[2]!));
  else if (at) Object.assign(p, coord(at[1]!, at[2]!));

  // アプリの共有リンクは ?q=店名, 住所 の形になることがある
  const q = u.searchParams.get("q") ?? u.searchParams.get("query");
  if (q) {
    const ll = q.match(/^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/);
    if (ll) Object.assign(p, coord(ll[1]!, ll[2]!));
    // 〒から始まる形式は「住所＋（ビル名）＋店名」がカンマ無しで繋がっている。
    // 住所は番地（数字-数字）で終わるので、そこまでを住所、残りを店名の候補にする
    // （ビル名が残って完全ではないことがあるが、message の1行目があればそちらを優先する）
    else if (/^〒?\d{3}-?\d{4}/.test(q)) {
      const m = q.match(/^(.*[\d０-９]+[-−－][\d０-９]+)\s*(\S.*)?$/);
      p.address = (m?.[1] ?? q).trim();
      if (m?.[2]) p.name = m[2].trim();
    }
    else {
      const [head, ...rest] = q.split(/[,，、]\s*/);
      p.name ??= head?.trim();
      if (rest.length) p.address = rest.join(" ").trim();
    }
  }
  const ll = u.searchParams.get("ll")?.split(",");
  if (p.lat === undefined && ll?.length === 2) Object.assign(p, coord(ll[0]!, ll[1]!));
  return p;
}

const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
// LINE などのリンクプレビューと同じく、クローラー向け User-Agent だと
// Google が店名だけのきれいな og:title（例："かかん 富ヶ谷店 · 渋谷区, 東京都"）を返してくる
const CRAWLER_UA = "facebookexternalhit/1.1";

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" };
const decodeEntities = (s: string) => s.replace(/&(amp|lt|gt|quot|#39);/g, (_, e: string) => ENTITIES[e]!);

/** 共有リンクの og:title から店名だけを読む（住所やビル名が混ざらない、最も確実な経路） */
async function fetchOgTitle(url: URL): Promise<string | undefined> {
  const res = await fetch(url.href, { headers: { "User-Agent": CRAWLER_UA, "Accept-Language": "ja" } });
  if (!res.ok) return undefined;
  const html = await res.text();
  const m = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>|<meta[^>]*content="([^"]*)"[^>]*property="og:title"[^>]*>/);
  const raw = m?.[1] ?? m?.[2];
  // "店名 · 住所" の形で返ってくるので、店名部分だけを使う
  return raw ? decodeEntities(raw).split(" · ")[0]?.trim() || undefined : undefined;
}

/** 短縮リンクを Google の外に出ない範囲で辿って、最後の URL を返す */
async function expand(start: URL): Promise<URL | null> {
  let u = start;
  for (let hop = 0; hop < 6; hop++) {
    if (isMapsPage(u) && (u.pathname.includes("/place/") || u.searchParams.has("q") || u.searchParams.has("query") || /@-?\d/.test(u.pathname))) return u;
    const res = await fetch(u.href, { redirect: "manual", headers: { "User-Agent": UA, "Accept-Language": "ja" } });
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) {
      let next = new URL(loc, u);
      // EU などで出る同意画面は continue に本来の行き先が入っている
      const cont = next.hostname === "consent.google.com" && next.searchParams.get("continue");
      if (cont) next = new URL(cont);
      if (!isGoogle(next)) return null;
      u = next;
      continue;
    }
    // 転送ではなく HTML が返ってきたら、本文中の Googleマップの URL を拾う
    if (res.ok) {
      const html = await res.text();
      const m = html.match(/https:\/\/(?:www\.|maps\.)?google\.(?:com|co\.jp)\/maps[^"'\s<>\\]*/);
      if (m) return new URL(m[0].replace(/&amp;/g, "&"));
    }
    return isMapsPage(u) ? u : null;
  }
  return null;
}

/** 住所 → 座標（国土地理院 住所検索。日本の住所のみ） */
async function geocode(address: string) {
  const q = address
    .normalize("NFKC")
    .replace(/〒?\s*\d{3}-?\d{4}/, "")
    .replace(/^日本[、,]?\s*/, "")
    .replace(/[−‐‑–—]/g, "-")
    .trim();
  if (!q) return {};
  const res = await fetch(`https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(q)}`);
  if (!res.ok) return {};
  const hits = (await res.json()) as { geometry?: { coordinates?: [number, number] } }[];
  const c = hits[0]?.geometry?.coordinates;
  return c ? coord(c[1], c[0]) : {};
}

/** 共有で送られてきた文面（リンク＋店名など）から店の情報を作る */
export async function resolvePlace(message: string): Promise<Place | null> {
  const start = findMapsUrl(message);
  if (!start) return null;
  const end = await expand(start).catch((e) => { console.error("expand failed", e); return null; });
  const p = end ? parseMapsUrl(end) : {};
  // og:title（LINE などのリンクプレビューと同じ経路）が取れれば、URL からの推測より優先する
  const ogName = await fetchOgTitle(start).catch((e) => { console.error("og:title failed", e); return undefined; });
  if (ogName) p.name = ogName;
  // 座標が取れない原因調査用（原因が分かったら消す）
  console.log("resolvePlace", { start: start.href, end: end?.href, ogName, name: p.name, address: p.address, lat: p.lat, lng: p.lng });
  // 共有の文面に店名の行があれば、それが一番確実なので最優先する
  const msgName = message.split("\n").map((l) => l.trim()).find((l) => l && !/https?:\/\//.test(l));
  if (msgName) p.name = msgName;
  if (p.lat === undefined && p.address) Object.assign(p, await geocode(p.address).catch(() => ({})));
  return p;
}

export type Station = { area: string; access: string };

/** 座標 → 最寄り駅と徒歩分数（直線距離の1.25倍を道のりとみなし、80m＝1分で計算） */
export async function nearestStation(lat: number, lng: number): Promise<Station | null> {
  try {
    const res = await fetch(`https://express.heartrails.com/api/json?method=getStations&x=${lng}&y=${lat}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { response?: { station?: { name: string; distance: string }[] } };
    const st = data.response?.station?.[0];
    if (!st) return null;
    const meters = parseInt(st.distance, 10) || 0;
    const min = Math.max(1, Math.ceil((meters * 1.25) / 80));
    return { area: st.name, access: `${st.name}駅 徒歩${min}分` };
  } catch (e) {
    console.error("station lookup failed", e);
    return null;
  }
}

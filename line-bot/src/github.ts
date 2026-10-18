/* 店データ（src/data/shops.json）と写真を GitHub に1回のコミットで書き込む。
   master に入ると既存の GitHub Actions がサイトをビルド・公開する */

import type { Env } from "./line.ts";

export type Shop = {
  id: string; name: string; yomi: string; genre: string; area: string; access: string;
  budget: number; dish: string; score: number; lat: number; lng: number; photo: string; memo: string;
  visited?: string;
};

const DATA_PATH = "src/data/shops.json";

async function gh<T>(env: Env, path: string, init: RequestInit = {}, accept = "application/vnd.github+json"): Promise<T> {
  const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: accept,
      "User-Agent": "umai-mise-dake-line-bot",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.body && { "Content-Type": "application/json" }),
    },
  });
  if (!res.ok) throw new GitHubError(res.status, `GitHub ${init.method ?? "GET"} ${path}: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return (accept.endsWith("raw+json") ? res.text() : res.json()) as Promise<T>;
}

class GitHubError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

/** 1店＝1行の JSON。差分が読みやすいように */
export const formatShops = (shops: Shop[]) => "[\n" + shops.map((s) => "  " + JSON.stringify(s)).join(",\n") + "\n]\n";

/** 店名から id を作る。英字の店名ならそれを、日本語なら日付ベースにする */
export function makeId(name: string, taken: Set<string>, now = new Date()) {
  const slug = name.normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32).replace(/-+$/, "");
  const jst = new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10).replace(/-/g, "");
  const base = slug.length >= 3 ? slug : `shop-${jst}`;
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  return id;
}

/** 英字の店名ならそのまま大文字にして読みにする。日本語の店名は空（あとで手で足せる） */
export const makeYomi = (name: string) => {
  const n = name.normalize("NFKC");
  return /^[\x20-\x7e]+$/.test(n) ? n.toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim() : "";
};

export async function publishShop(env: Env, draft: Omit<Shop, "id" | "yomi" | "photo" | "visited"> & { visited: string }, photoBase64?: string) {
  const branch = encodeURIComponent(env.GITHUB_BRANCH);
  const photoBlob = photoBase64
    ? await gh<{ sha: string }>(env, "/git/blobs", { method: "POST", body: JSON.stringify({ content: photoBase64, encoding: "base64" }) })
    : null;

  // 同時に別の更新が入っていたら（fast-forward できなければ）読み直してやり直す
  for (let attempt = 0; ; attempt++) {
    const ref = await gh<{ object: { sha: string } }>(env, `/git/ref/heads/${branch}`);
    const head = ref.object.sha;
    const commit = await gh<{ tree: { sha: string } }>(env, `/git/commits/${head}`);
    const raw = await gh<string>(env, `/contents/${DATA_PATH}?ref=${head}`, {}, "application/vnd.github.raw+json");
    const shops = JSON.parse(raw) as Shop[];

    const id = makeId(draft.name, new Set(shops.map((s) => s.id)));
    const shop: Shop = {
      id, name: draft.name, yomi: makeYomi(draft.name), genre: draft.genre, area: draft.area, access: draft.access,
      budget: draft.budget, dish: draft.dish, score: draft.score, lat: draft.lat, lng: draft.lng,
      photo: photoBlob ? `img/${id}.jpg` : "", memo: draft.memo,
      // 訪問日は空なら項目ごと省く（既存の店の行と形をそろえる）
      ...(draft.visited && { visited: draft.visited }),
    };

    const tree = await gh<{ sha: string }>(env, "/git/trees", {
      method: "POST",
      body: JSON.stringify({
        base_tree: commit.tree.sha,
        tree: [
          { path: DATA_PATH, mode: "100644", type: "blob", content: formatShops([...shops, shop]) },
          ...(photoBlob ? [{ path: `public/${shop.photo}`, mode: "100644", type: "blob", sha: photoBlob.sha }] : []),
        ],
      }),
    });
    const created = await gh<{ sha: string }>(env, "/git/commits", {
      method: "POST",
      body: JSON.stringify({ message: `LINEから追加: ${shop.name}`, tree: tree.sha, parents: [head] }),
    });
    try {
      await gh(env, `/git/refs/heads/${branch}`, { method: "PATCH", body: JSON.stringify({ sha: created.sha, force: false }) });
      return shop;
    } catch (e) {
      if (!(e instanceof GitHubError && e.status === 422) || attempt >= 2) throw e;
    }
  }
}

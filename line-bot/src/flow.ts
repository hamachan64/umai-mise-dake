/* LINE での会話の流れ。下書きは KV に置き、1日で自動的に消える

   共有リンク（または位置情報）→ ジャンル → 推し度 → 予算 → 訪問日 → 一品 → メモ → 写真 → 確認 → 投稿
   店名や場所が取れなかったときだけ、そのぶんを途中で聞く */

import { GENRES, SCORE_LABEL } from "../../src/data/choices.ts";
import { type Env, type LineEvent, type Message, text, button, camera, cameraRoll, datePicker, location, reply, getContent } from "./line.ts";
import { findMapsUrl, nearestStation, resolvePlace } from "./maps.ts";
import { stripJpegMetadata, toBase64 } from "./jpeg.ts";
import { publishShop } from "./github.ts";
import { generateMemo } from "./memo.ts";

const GENRE_NAMES = Object.keys(GENRES) as (keyof typeof GENRES)[];
/** クイックリプライは1通13個までなので、ジャンルは11個ずつ＋前後ボタンでページを分ける */
const GENRE_PAGE = 11;
export const BUDGETS = [500, 800, 1000, 1500, 2000, 3000, 4000, 5000, 7000, 10000, 15000, 20000];

const STEPS = ["name", "locate", "genre", "score", "budget", "visited", "dish", "memo", "photo", "confirm"] as const;
type Step = (typeof STEPS)[number] | "publishing";

export type Draft = {
  step: Step;
  name: string;
  /** 店名が住所からの推測（ビル名が混ざることがある）のときだけ true。確認が済むまで name の手順を飛ばさない */
  nameUnconfirmed?: boolean;
  lat?: number;
  lng?: number;
  area: string;
  access: string;
  genre?: string;
  score?: number;
  budget?: number;
  /** 訪問日（YYYY-MM-DD）。サイトには出さず Notion にだけ写る */
  visited: string;
  dish: string;
  memo: string;
  photo: boolean;
};

const TTL = 24 * 60 * 60;
const draftKey = (uid: string) => `draft:${uid}`;
const photoKey = (uid: string) => `photo:${uid}`;
const load = (env: Env, uid: string) => env.DRAFTS.get<Draft>(draftKey(uid), "json");
const save = (env: Env, uid: string, d: Draft) => env.DRAFTS.put(draftKey(uid), JSON.stringify(d), { expirationTtl: TTL });
const clear = (env: Env, uid: string) => Promise.all([env.DRAFTS.delete(draftKey(uid)), env.DRAFTS.delete(photoKey(uid))]);

const yen = (n: number) => "¥" + n.toLocaleString("ja-JP");
/** 日本時間の日付（YYYY-MM-DD）。daysAgo=1 で昨日 */
export const jstDate = (daysAgo = 0, now = Date.now()) =>
  new Date(now + 9 * 3600_000 - daysAgo * 86400_000).toISOString().slice(0, 10);
/** 実在する日付で、未来でないか（2026-02-30 のような日付は Date が繰り上げてしまうので往復で確かめる） */
const isDate = (s: string) => {
  const t = /^\d{4}-\d{2}-\d{2}$/.test(s) ? Date.parse(s) : NaN;
  return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === s && s <= jstDate();
};
const dateLabel = (s: string) => s.replace(/^(\d{4})-0?(\d+)-0?(\d+)$/, "$1年$2月$3日");
const scoreLabel = (n: number) => SCORE_LABEL[n as keyof typeof SCORE_LABEL];

/** 店名・場所は分かっていれば聞かずに飛ばす。店名が確認待ち（nameUnconfirmed）のときは飛ばさない */
const known = (d: Draft, s: Step) => (s === "name" ? !!d.name && !d.nameUnconfirmed : s === "locate" ? d.lat !== undefined : false);
function advance(d: Draft) {
  let i = STEPS.indexOf(d.step as (typeof STEPS)[number]) + 1;
  while (known(d, STEPS[i]!)) i++;
  d.step = STEPS[i]!;
}
function begin(d: Draft) {
  d.step = "name";
  if (known(d, "name")) advance(d);
}
/** 1つ前の手順。店名・場所が自動で分かっていた手順までは戻らない（戻っても聞くことが無いので） */
function prevStep(d: Draft): Step | null {
  let i = STEPS.indexOf(d.step as (typeof STEPS)[number]) - 1;
  while (i >= 0 && known(d, STEPS[i]!)) i--;
  return i >= 0 ? STEPS[i]! : null;
}

const newDraft = (name = ""): Draft =>
  ({ step: "name", name: name.trim().slice(0, 60), area: "", access: "", visited: "", dish: "", memo: "", photo: false });

async function locate(d: Draft, lat: number, lng: number) {
  d.lat = Math.round(lat * 1e6) / 1e6;
  d.lng = Math.round(lng * 1e6) / 1e6;
  const st = await nearestStation(d.lat, d.lng);
  d.area = st?.area ?? "その他";
  d.access = st?.access ?? "";
}

export function parseBudget(t: string) {
  const s = t.normalize("NFKC").replace(/[,\s円¥〜~]/g, "");
  const n = /^\d+$/.test(s) ? Number(s) : NaN;
  return n >= 1 && n <= 1_000_000 ? n : null;
}

const HELP = [
  "【使い方】",
  "1. Googleマップで店を開いて「共有」→ このトークに送る",
  "2. ジャンル・推し度・予算をボタンで選ぶ",
  "3. 一品・メモを入力（スキップ可。メモは空欄のままだとAIが考えます）",
  "4. 写真を送る（なしでも可）",
  "5.「投稿する」で、1〜2分後にサイトに反映",
  "",
  "Googleマップのリンクの代わりに、＋ →「位置情報」で店を送っても始められます。",
  "選び直したいときは「◀ 戻る」、途中でやめるときは「やめる」と送ってください。",
].join("\n");

const summary = (d: Draft) => [
  `店名：${d.name}`,
  `場所：${d.access || d.area}`,
  `ジャンル：${d.genre}`,
  `推し度：${d.score} ${scoreLabel(d.score ?? 0)}`,
  `予算：${yen(d.budget ?? 0)}`,
  `訪問日：${d.visited ? dateLabel(d.visited) : "—"}`,
  `一品：${d.dish || "—"}`,
  `メモ：${d.memo || "—"}`,
  `写真：${d.photo ? "あり" : "なし"}`,
].join("\n");

/** 前の手順に戻れるときだけ付ける「◀ 戻る」ボタン */
const backBtn = (d: Draft) => (prevStep(d) ? [button("◀ 戻る", "back")] : []);

/** 店名を空白区切りの単語に分ける（ビル名などを1単語ずつ削るため） */
const nameWords = (name: string) => name.split(/\s+/).filter(Boolean);

export function prompt(d: Draft, page = 0): Message {
  switch (d.step) {
    case "name": {
      if (!(d.nameUnconfirmed && d.name)) return text("店名を送ってください。");
      // ビル名などが前後にくっついているだけのことが多いので、単語ごと削って直せるようにする
      const words = nameWords(d.name);
      return text(`店名はこれで合っていますか？\n\n「${d.name}」\n\nビル名などが混ざっていることがあります。前後の単語を削れます。合っていれば「これでOK」、大きく違う場合は正しい店名を送ってください。`, [
        ...(words.length > 1 ? [button("先頭を削る", "trim:front")] : []),
        ...(words.length > 1 ? [button("末尾を削る", "trim:back")] : []),
        button("これでOK", "ok"),
      ]);
    }
    case "locate":
      return text(`「${d.name}」の場所が分かりませんでした。\n＋ →「位置情報」から店の場所を送ってください。`,
        [location("位置情報を送る"), button("やめる", "cancel")]);
    case "genre": {
      const names = GENRE_NAMES.slice(page * GENRE_PAGE, (page + 1) * GENRE_PAGE);
      return text("ジャンルは？", [
        ...(page > 0 ? [button("◀ 前へ", `gpage:${page - 1}`, "前のジャンル")] : []),
        ...names.map((g) => button(`${GENRES[g].icon} ${g}`, `genre:${GENRE_NAMES.indexOf(g)}`, g)),
        ...((page + 1) * GENRE_PAGE < GENRE_NAMES.length ? [button("その他 ▶", `gpage:${page + 1}`, "ほかのジャンル")] : []),
      ]);
    }
    case "score":
      return text("推し度は？", [...backBtn(d), ...[5, 4, 3, 2, 1].map((n) => button(`${n} ${scoreLabel(n)}`, `score:${n}`))]);
    case "budget":
      return text("ひとりあたりの予算は？\n（ボタンにない金額は数字で送ってください）", [...backBtn(d), ...BUDGETS.map((n) => button(yen(n), `budget:${n}`))]);
    case "visited":
      return text("いつ行きましたか？（サイトには出ず、Notion にだけ記録されます）", [
        ...backBtn(d),
        button("今日", "visited:0"),
        button("昨日", "visited:1"),
        datePicker("日付を選ぶ", "visited:pick", jstDate()),
        button("スキップ", "skip"),
      ]);
    case "dish":
      return text("おすすめの一品は？（文字で送ってください）", [...backBtn(d), button("スキップ", "skip")]);
    case "memo":
      return text("ひとことメモは？（文字で送ってください）", [...backBtn(d), button("スキップ", "skip")]);
    case "photo":
      return text("写真を1枚送れます。", [...backBtn(d), cameraRoll("写真を選ぶ"), camera("撮る"), button("写真なし", "skip")]);
    case "confirm":
      return text(`${summary(d)}\n\nこの内容で投稿しますか？`,
        [button("投稿する", "publish"), button("選び直す", "redo"), ...backBtn(d), button("やめる", "cancel")]);
    case "publishing":
      return text("投稿中です。少し待ってください。");
  }
}

type Say = (...m: Message[]) => Promise<void>;

export async function handleEvent(env: Env, ev: LineEvent) {
  // LINE の再送で二重投稿しないように
  if (ev.deliveryContext?.isRedelivery) return;
  const uid = ev.source?.type === "user" ? ev.source.userId : undefined;
  const token = ev.replyToken;
  if (!uid || !token) return;

  const allowed = (env.ALLOWED_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!allowed.includes(uid)) {
    // 許可リストが空のあいだだけ、自分のIDを調べられるように返す。設定後は他人には何も返さない
    if (!allowed.length && (ev.type === "message" || ev.type === "follow")) {
      await reply(env, token, [text(`【セットアップ用】あなたの LINE ユーザーID は\n${uid}\nです。これを ALLOWED_USER_IDS に登録すると投稿できるようになります。`)]);
    }
    return;
  }

  const say: Say = (...m) => reply(env, token, m);
  try {
    await route(env, uid, ev, say);
  } catch (e) {
    console.error(e);
    await say(text(`エラーが起きました：${e instanceof Error ? e.message : String(e)}`));
  }
}

async function route(env: Env, uid: string, ev: LineEvent, say: Say) {
  if (ev.type === "follow") return say(text(HELP));
  const draft = await load(env, uid);
  if (ev.type === "postback") return onPostback(env, uid, draft, ev.postback?.data ?? "", ev.postback?.params?.date, say);
  const m = ev.message;
  if (ev.type !== "message" || !m) return;
  if ("text" in m) return onText(env, uid, draft, m.text, say);
  if ("latitude" in m) return onLocation(env, uid, draft, m.latitude, m.longitude, m.title, say);
  if (m.type === "image") return onImage(env, uid, draft, m.id, say);
  return say(text("テキスト・位置情報・写真だけ受け付けています。"));
}

async function onText(env: Env, uid: string, draft: Draft | null, raw: string, say: Say) {
  const t = raw.trim();
  if (/^(やめる|キャンセル|cancel)$/i.test(t)) {
    await clear(env, uid);
    return say(text("下書きを消しました。"));
  }
  if (/^(使い方|ヘルプ|help)$/i.test(t)) return say(text(HELP));

  if (findMapsUrl(t)) {
    const place = await resolvePlace(t);
    const d = newDraft(place?.name);
    d.nameUnconfirmed = place?.nameUncertain ?? false;
    if (place?.lat !== undefined && place.lng !== undefined) await locate(d, place.lat, place.lng);
    begin(d);
    await env.DRAFTS.delete(photoKey(uid));
    await save(env, uid, d);
    const found = [
      draft ? "（前の下書きは破棄しました）" : "",
      d.name && `📍 ${d.name}${d.nameUnconfirmed ? "（要確認）" : ""}`,
      d.lat !== undefined && (d.access || "最寄り駅は見つかりませんでした"),
    ].filter(Boolean).join("\n");
    return say(...(found ? [text(found)] : []), prompt(d));
  }

  if (!draft) return say(text(HELP));
  switch (draft.step) {
    case "name":
      draft.name = t.slice(0, 60);
      draft.nameUnconfirmed = false;
      break;
    case "budget": {
      const n = parseBudget(t);
      if (!n) return say(text("金額は数字で送ってください（例：1200）"), prompt(draft));
      draft.budget = n;
      break;
    }
    case "dish":
      draft.dish = t.slice(0, 100);
      break;
    case "memo":
      draft.memo = t.slice(0, 400);
      break;
    default:
      return say(text("下のボタンから選んでください。"), prompt(draft));
  }
  advance(draft);
  await save(env, uid, draft);
  return say(prompt(draft));
}

async function onLocation(env: Env, uid: string, draft: Draft | null, lat: number, lng: number, title: string | undefined, say: Say) {
  const d = draft ?? newDraft(title);
  await locate(d, lat, lng);
  if (!draft) begin(d);
  else if (d.step === "locate") advance(d);
  await save(env, uid, d);
  return say(text(`📍 ${d.access || "場所を受け取りました（最寄り駅は見つかりませんでした）"}`), prompt(d));
}

async function onImage(env: Env, uid: string, draft: Draft | null, messageId: string, say: Say) {
  if (!draft || (draft.step !== "photo" && draft.step !== "confirm")) {
    return say(text("写真は最後に聞くので、そのときに送ってください。"), ...(draft ? [prompt(draft)] : []));
  }
  const jpg = stripJpegMetadata(await getContent(env, messageId));
  if (!jpg) return say(text("この写真は使えませんでした（JPEG・5MBまで）。別の写真を送るか「写真なし」を選んでください。"), prompt(draft));
  await env.DRAFTS.put(photoKey(uid), toBase64(jpg), { expirationTtl: TTL });
  draft.photo = true;
  draft.step = "confirm";
  await save(env, uid, draft);
  return say(prompt(draft));
}

async function onPostback(env: Env, uid: string, draft: Draft | null, data: string, pickedDate: string | undefined, say: Say) {
  if (data === "cancel") {
    await clear(env, uid);
    return say(text("下書きを消しました。"));
  }
  if (!draft) return say(text("下書きがありません。Googleマップの共有リンクを送って始めてください。"));

  // ボタンの値も鵜呑みにせず、今の段階で受け付けるものか・範囲内かを確かめる
  const [key, val = ""] = data.split(":");
  const n = /^\d+$/.test(val) ? Number(val) : NaN;
  const step = draft.step;
  if (key === "back") {
    const p = prevStep(draft);
    if (!p) return say(text("これより前には戻れません。"), prompt(draft));
    draft.step = p;
    await save(env, uid, draft);
    return say(prompt(draft));
  }
  if (key === "trim" && step === "name" && draft.nameUnconfirmed) {
    const words = nameWords(draft.name);
    if (words.length > 1) draft.name = (val === "front" ? words.slice(1) : words.slice(0, -1)).join(" ");
    await save(env, uid, draft);
    return say(prompt(draft));
  }
  if (key === "skip" && step === "memo") {
    // 空欄のままにせず、分かっている情報からAIにひとことメモを考えてもらう
    const memo = await generateMemo(env, { name: draft.name, genre: draft.genre ?? "", dish: draft.dish, area: draft.area, score: draft.score ?? 0 });
    draft.memo = memo;
    advance(draft);
    await save(env, uid, draft);
    return say(...(memo ? [text(`🤖 メモを考えました：\n${memo}`)] : []), prompt(draft));
  }

  // note は次の質問の前に一言添える確認。特にカレンダーでの日付選択はLINE側では
  // 何も表示されないので、ちゃんと記録されたことが分かるようにする
  let note: string | undefined;
  if (key === "gpage" && step === "genre" && n * GENRE_PAGE < GENRE_NAMES.length) return say(prompt(draft, n));
  if (key === "ok" && step === "name" && draft.nameUnconfirmed) draft.nameUnconfirmed = false;
  else if (key === "genre" && step === "genre" && GENRE_NAMES[n]) draft.genre = GENRE_NAMES[n];
  else if (key === "score" && step === "score" && scoreLabel(n)) draft.score = n;
  else if (key === "budget" && step === "budget" && BUDGETS.includes(n)) draft.budget = n;
  else if (key === "visited" && step === "visited" && (n === 0 || n === 1)) {
    draft.visited = jstDate(n);
    note = `🗓 訪問日：${dateLabel(draft.visited)}`;
  } else if (key === "visited" && step === "visited" && val === "pick" && pickedDate && isDate(pickedDate)) {
    draft.visited = pickedDate;
    note = `🗓 訪問日：${dateLabel(draft.visited)}`;
  } else if (key === "skip" && step === "visited") draft.visited = "";
  else if (key === "skip" && step === "dish") draft.dish = "";
  else if (key === "skip" && step === "photo") {
    draft.photo = false;
    await env.DRAFTS.delete(photoKey(uid));
  } else if (key === "redo" && step === "confirm") {
    draft.step = "genre";
    await save(env, uid, draft);
    return say(prompt(draft));
  } else if (key === "publish" && step === "confirm") return publish(env, uid, draft, say);
  else if (step === "publishing") return say(prompt(draft));
  else return say(text("そのボタンは今は使えません。"), prompt(draft));

  advance(draft);
  await save(env, uid, draft);
  return say(...(note ? [text(note)] : []), prompt(draft));
}

async function publish(env: Env, uid: string, d: Draft, say: Say) {
  // 通常ここに来るまでに name の手順で止まるはずだが、念のための保険
  if (d.nameUnconfirmed) {
    d.step = "name";
    await save(env, uid, d);
    return say(prompt(d));
  }
  if (!d.name || d.lat === undefined || d.lng === undefined || !d.genre || !d.score || !d.budget) {
    d.step = "genre";
    await save(env, uid, d);
    return say(text("足りない項目があります。もう一度選んでください。"), prompt(d));
  }
  // 「投稿する」の連打で二重に投稿しないよう、先に印を付けておく
  d.step = "publishing";
  await save(env, uid, d);
  try {
    const photo = d.photo ? await env.DRAFTS.get(photoKey(uid)) : null;
    const shop = await publishShop(env, {
      name: d.name, genre: d.genre, area: d.area, access: d.access, budget: d.budget, dish: d.dish,
      score: d.score, lat: d.lat, lng: d.lng, memo: d.memo, visited: d.visited ?? "",
    }, photo ?? undefined);
    await clear(env, uid);
    const lost = d.photo && !photo ? "\n（写真は時間が経って消えていたため、なしで投稿しました）" : "";
    return say(text(`投稿しました！🎉\n「${shop.name}」は1〜2分でサイトに反映されます。${lost}\n${env.SITE_URL}`));
  } catch (e) {
    d.step = "confirm";
    await save(env, uid, d);
    throw e;
  }
}

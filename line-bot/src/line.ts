/* LINE Messaging API とのやりとり。使うのは「返信」と「画像の取得」だけで、
   どちらも無料プランの通数（月200通）には数えられない */

export interface Env {
  DRAFTS: KVNamespace;
  LINE_CHANNEL_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
  GITHUB_TOKEN: string;
  /** 投稿を受け付ける LINE ユーザーID（カンマ区切り）。空ならセットアップ用に自分のIDを返すだけ */
  ALLOWED_USER_IDS?: string;
  GITHUB_REPO: string;
  GITHUB_BRANCH: string;
  SITE_URL: string;
  /** ひとことメモの自動生成に使う（Workers AI、無料枠） */
  AI: Ai;
}

export type LineEvent = {
  type: string;
  replyToken?: string;
  source?: { type: string; userId?: string };
  deliveryContext?: { isRedelivery: boolean };
  message?:
    | { type: "text"; id: string; text: string }
    | { type: "image"; id: string }
    | { type: "location"; id: string; title?: string; address?: string; latitude: number; longitude: number }
    | { type: string; id: string };
  postback?: { data: string; params?: { date?: string } };
};

type Action =
  | { type: "postback"; label: string; data: string; displayText: string }
  | { type: "camera"; label: string }
  | { type: "cameraRoll"; label: string }
  | { type: "location"; label: string }
  | { type: "datetimepicker"; label: string; data: string; mode: "date"; initial?: string; max?: string };

export type Message = { type: "text"; text: string; quickReply?: { items: { type: "action"; action: Action }[] } };

/** クイックリプライ（入力欄の上に出るボタン）。LINE の上限は1通13個・ラベル20文字 */
export const text = (t: string, actions: Action[] = []): Message => ({
  type: "text",
  text: t.slice(0, 5000),
  ...(actions.length && {
    quickReply: { items: actions.slice(0, 13).map((action) => ({ type: "action" as const, action })) },
  }),
});

export const button = (label: string, data: string, displayText = label): Action =>
  ({ type: "postback", label: label.slice(0, 20), data, displayText });
export const cameraRoll = (label: string): Action => ({ type: "cameraRoll", label });
export const camera = (label: string): Action => ({ type: "camera", label });
export const location = (label: string): Action => ({ type: "location", label });
/** カレンダーから日付を選ぶボタン。選んだ日付は postback の params.date で届く */
export const datePicker = (label: string, data: string, max?: string): Action =>
  ({ type: "datetimepicker", label, data, mode: "date", ...(max && { initial: max, max }) });

/** 署名を確かめて、本物の LINE から届いたリクエストかを判定する（比較は定数時間） */
export async function verifySignature(body: string, signature: string | null, secret: string) {
  if (!signature || !secret) return false;
  let sig: Uint8Array;
  try {
    sig = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
  } catch {
    return false;
  }
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  return crypto.subtle.verify("HMAC", key, sig, enc.encode(body));
}

export async function reply(env: Env, replyToken: string, messages: Message[]) {
  const res = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}` },
    body: JSON.stringify({ replyToken, messages: messages.slice(0, 5) }),
  });
  if (!res.ok) console.error("LINE reply failed", res.status, await res.text());
}

/** ユーザーが送った画像の中身を取る */
export async function getContent(env: Env, messageId: string) {
  const res = await fetch(`https://api-data.line.me/v2/bot/message/${encodeURIComponent(messageId)}/content`, {
    headers: { Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`画像を受け取れませんでした（${res.status}）`);
  return new Uint8Array(await res.arrayBuffer());
}

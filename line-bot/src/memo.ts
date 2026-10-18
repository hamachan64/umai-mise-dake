/* ひとことメモの自動生成。Cloudflare Workers AI（無料枠の範囲）を使う。
   失敗しても投稿自体は止めたくないので、何が起きても空文字を返すだけにしてある */

import type { Env } from "./line.ts";

const MODEL = "@cf/qwen/qwen3-30b-a3b-fp8";

const SYSTEM = [
  "あなたは個人のグルメまとめサイトの運営者本人です。実際にその店へ行って感じたことを書くような、",
  "くだけた一人称のひとことメモを1つ書いてください。",
  "条件：1〜2文、80字以内。絵文字・敬語・「〜です」「〜ます」は使わない。店名をそのまま繰り返さない。",
  "与えられた情報だけから、ありそうな感想を自然に書く。誇張しすぎない。",
].join("");

export type MemoInput = { name: string; genre: string; dish: string; area: string; score: number };

export async function generateMemo(env: Env, info: MemoInput): Promise<string> {
  try {
    const out = await env.AI.run(MODEL, {
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            `店名：${info.name}`,
            `ジャンル：${info.genre}`,
            `エリア：${info.area}`,
            `おすすめの一品：${info.dish || "（未入力）"}`,
            `推し度：${info.score}/5`,
          ].join("\n"),
        },
      ],
      max_tokens: 200,
    });
    // モデルの出力形はチャット補完かプレーンな文字列かで変わるため、型では縛らずに読む
    const text = typeof out === "string" ? out : (out as { response?: string; choices?: { message?: { content?: string } }[] });
    const raw = typeof text === "string" ? text : (text.response ?? text.choices?.[0]?.message?.content);
    return raw?.trim().slice(0, 400) ?? "";
  } catch (e) {
    console.error("generateMemo failed", e);
    return "";
  }
}

/* ジャンルと推し度の選択肢。サイトと LINE Bot（line-bot/）の両方がここを読みます */

/* ジャンルごとの絵柄・食感オノマトペ・一文字の漢字（k）・色（tone: shu/ai/matcha/karashi）。
   Bot のジャンル選択ボタンもこの並び順です。
   新しいジャンルはここに足すだけで、目録のタブ・図鑑・検索・地図の札・Bot のボタンに反映されます */
export const GENRES = {
  "ラーメン":         { icon: "🍜", o: "ズルッ", k: "麺", tone: "karashi" },
  "そば・うどん":     { icon: "🥢", o: "つるっ", k: "蕎", tone: "matcha" },
  "寿司":             { icon: "🍣", o: "ぷりっ", k: "鮨", tone: "ai" },
  "和食":             { icon: "🍱", o: "ほろり", k: "和", tone: "matcha" },
  "焼肉":             { icon: "🥩", o: "ジュージュー", k: "焼", tone: "shu" },
  "居酒屋":           { icon: "🍺", o: "ぷはー", k: "酒", tone: "ai" },
  "中華":             { icon: "🥟", o: "パラッ", k: "華", tone: "shu" },
  "アジアン":         { icon: "🌶", o: "ヒリッ", k: "亜", tone: "karashi" },
  "イタリアン":       { icon: "🍝", o: "もちっ", k: "伊", tone: "matcha" },
  "バーガー・肉料理": { icon: "🍔", o: "がぶっ", k: "肉", tone: "shu" },
  "カレー":           { icon: "🍛", o: "ピリッ", k: "辛", tone: "karashi" },
  "洋食":             { icon: "🍽", o: "じゅわっ", k: "洋", tone: "ai" },
  "パン":             { icon: "🥐", o: "さくっ", k: "麦", tone: "karashi" },
  "スイーツ":         { icon: "🍰", o: "とろっ", k: "甘", tone: "shu" },
  "和菓子":           { icon: "🍡", o: "もちもち", k: "菓", tone: "matcha" },
  "カフェ・喫茶":     { icon: "☕", o: "ほっ", k: "喫", tone: "ai" },
} as const;

export type Genre = keyof typeof GENRES;

/** 推し度（score）の呼び方。数字だけだと伝わりにくいので言葉を添える */
export const SCORE_LABEL = {
  5: "激推し",
  4: "推し",
  3: "好き",
  2: "ふつう",
  1: "いまいち",
} as const;
export const SCORE_MAX = 5;
export type Score = keyof typeof SCORE_LABEL;

/* =====================================================================
   お店データ。運用中に触るのは基本このファイルだけです。

   - budget は「ひとりあたりの目安（円）」を数値で。表示と絞り込みに使います
   - lat / lng は地図ページのピン位置。Googleマップで店を右クリック →
     いちばん上に出る座標をコピーして貼るのが早いです
   - photo に画像パス（例 "img/marutama.jpg" を public/ に置く）を入れると
     カードのビジュアルが写真に差し替わります。空なら絵文字表示
   ===================================================================== */

export type Shop = {
  id: string;
  name: string;
  yomi: string;
  genre: Genre;
  area: string;
  access: string;
  budget: number;
  dish: string;
  score: 1 | 2 | 3 | 4 | 5;
  lat: number;
  lng: number;
  photo: string;
  memo: string;
};

export type Genre = keyof typeof GENRES;

/* ジャンルごとの絵柄・食感オノマトペ。増やすときはここにも追加 */
export const GENRES = {
  "焼肉・ホルモン": { icon: "🥩", o: "ジュージュー" },
  "寿司":           { icon: "🍣", o: "ぷりっ" },
  "ラーメン":       { icon: "🍜", o: "ズルッ" },
  "居酒屋":         { icon: "🍺", o: "ぷはー" },
  "カレー":         { icon: "🍛", o: "ピリッ" },
  "イタリアン":     { icon: "🍝", o: "もちっ" },
  "中華":           { icon: "🥟", o: "パラッ" },
  "喫茶・カフェ":   { icon: "☕", o: "ほっ" },
} as const;

export const SHOPS: Shop[] = [
  { id:"marutama",   name:"焼肉 まる玉",       yomi:"MARUTAMA",   genre:"焼肉・ホルモン", area:"新橋",   access:"新橋駅 烏森口 3分",  budget:5000,  dish:"上ミノとハラミ",     score:5, lat:35.6659, lng:139.7562, photo:"", memo:"ミノのゴリッとした食感が忘れられず月イチで通っています。換気の悪さすら味のうち。" },
  { id:"ensuke",     name:"ホルモン酒場 炎助",  yomi:"ENSUKE",     genre:"焼肉・ホルモン", area:"中目黒", access:"中目黒駅 5分",       budget:4000,  dish:"シマチョウ塩",       score:4, lat:35.6432, lng:139.6988, photo:"", memo:"ひとりでカウンターに座れる焼肉。タレが甘すぎず、ビールが止まりません。" },
  { id:"tokoshie",   name:"鮨 とこしえ",        yomi:"TOKOSHIE",   genre:"寿司",           area:"銀座",   access:"銀座一丁目駅 2分",   budget:15000, dish:"コハダ",             score:5, lat:35.6737, lng:139.7671, photo:"", memo:"記念日はここ。無言で握ってくれる感じが心地よく、コハダで実力がわかります。" },
  { id:"yagura",     name:"立ち食い鮨 やぐら",  yomi:"YAGURA",     genre:"寿司",           area:"新宿",   access:"新宿三丁目駅 4分",   budget:3000,  dish:"日替わり5貫",        score:4, lat:35.6912, lng:139.7061, photo:"", memo:"20分で満足して帰れる寿司。この価格でネタの鮮度がおかしい。" },
  { id:"kido",       name:"中華そば 木戸",      yomi:"KIDO",       genre:"ラーメン",       area:"神保町", access:"神保町駅 A5すぐ",    budget:1200,  dish:"中華そば＋味玉",     score:5, lat:35.6957, lng:139.7574, photo:"", memo:"煮干しの立った清湯。二日酔いの朝でも最後まで飲み干せるやさしさ。" },
  { id:"todorokiya", name:"らーめん 轟屋",      yomi:"TODOROKIYA", genre:"ラーメン",       area:"吉祥寺", access:"吉祥寺駅 北口 6分",  budget:1300,  dish:"味噌バター",         score:4, lat:35.7047, lng:139.5797, photo:"", memo:"冬に食べたい濃厚味噌。茹で加減を聞いてくれるので必ず固めで。" },
  { id:"norari",     name:"居酒屋 のらり",      yomi:"NORARI",     genre:"居酒屋",         area:"新宿",   access:"新宿駅 西口 7分",    budget:3500,  dish:"刺身の盛り合わせ",   score:4, lat:35.6923, lng:139.6968, photo:"", memo:"3人以上で行きたい店。日本酒が渋くて、店主に任せると外れません。" },
  { id:"tomekichi",  name:"大衆酒場 とめ吉",    yomi:"TOMEKICHI",  genre:"居酒屋",         area:"新橋",   access:"新橋駅 2分",         budget:2500,  dish:"煮込み",             score:3, lat:35.6673, lng:139.7590, photo:"", memo:"安い、早い、うるさい。仕事帰りの一杯目にちょうどいい雑さ。" },
  { id:"hinata",     name:"カリー食堂 ひなた",  yomi:"HINATA",     genre:"カレー",         area:"渋谷",   access:"渋谷駅 8分",         budget:1800,  dish:"2種あいがけ",        score:5, lat:35.6595, lng:139.6990, photo:"", memo:"副菜まで手を抜いてなくて、混ぜるほどおいしくなるタイプのスパイスカレー。" },
  { id:"ishidatami", name:"欧風カレー 石畳",    yomi:"ISHIDATAMI", genre:"カレー",         area:"神保町", access:"神保町駅 3分",       budget:2000,  dish:"ビーフカレー辛口",   score:4, lat:35.6966, lng:139.7561, photo:"", memo:"神保町らしい古き良き欧風。ルーが重いので昼は軽めにしておくこと。" },
  { id:"akari",      name:"トラットリア 灯",    yomi:"AKARI",      genre:"イタリアン",     area:"中目黒", access:"中目黒駅 4分",       budget:6000,  dish:"手打ちタリアテッレ", score:5, lat:35.6455, lng:139.6975, photo:"", memo:"デートで失敗しない一軒。パスタは必ず手打ちを頼んでください。" },
  { id:"yunoma",     name:"喫茶 ゆのま",        yomi:"YUNOMA",     genre:"喫茶・カフェ",   area:"吉祥寺", access:"吉祥寺駅 南口 5分",  budget:1200,  dish:"ブレンドとプリン",   score:4, lat:35.7010, lng:139.5793, photo:"", memo:"昼下がりに本を持っていく店。プリンが固めで、この硬さが好きな人にはたまらない。" },
];

/* ---- 以下は SHOPS から自動で導出されるもの。触らなくて大丈夫です ---- */

export const GENRE_LIST = [...new Set(SHOPS.map((s) => s.genre))];
export const AREA_LIST  = [...new Set(SHOPS.map((s) => s.area))];

export const iconOf  = (g: string) => GENRES[g as Genre]?.icon ?? "🍽";
export const onomaOf = (g: string) => GENRES[g as Genre]?.o ?? "うまい";

/** 予算帯。詳細検索の絞り込みに使います */
export const BUDGET_BANDS = [
  { id: "b1", label: "〜2,000円",       min: 0,     max: 2000 },
  { id: "b2", label: "2,000〜5,000円",  min: 2000,  max: 5000 },
  { id: "b3", label: "5,000〜10,000円", min: 5000,  max: 10000 },
  { id: "b4", label: "10,000円〜",      min: 10000, max: Infinity },
] as const;

export const yen = (n: number) => "¥" + n.toLocaleString("ja-JP");

export const bandOf = (budget: number) =>
  BUDGET_BANDS.find((b) => budget >= b.min && budget < b.max)?.id ?? "b4";

export const mapsUrl = (s: Shop) =>
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent(`${s.name} ${s.area}`);

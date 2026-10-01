# うまい店だけ。

自分のオススメ飲食店をまとめる静的サイト。Astro で作った3ページ構成です。

| ページ | 内容 |
| --- | --- |
| `/` | トップ。ジャンル／エリアのチップで絞り込み |
| `/search` | 詳細検索。キーワード・複数ジャンル・エリア・予算帯・推し度・並び替え |
| `/map` | 地図。Leaflet + OpenStreetMap のピンから探す |

店の詳細はどのページからもモーダルで開きます。

## 開発

```bash
npm install
npm run dev      # http://localhost:4321/umai-mise-dake
npm run build    # dist/ に静的書き出し
npm run preview  # ビルド結果を確認
npm run check    # 型チェック
```

## お店を追加・編集する

触るのは **`src/data/shops.ts` だけ**です。型が付いているので、ジャンル名を打ち間違えると
`npm run check` で落ちます。

```ts
{ id:"marutama", name:"焼肉 まる玉", yomi:"MARUTAMA", genre:"焼肉・ホルモン",
  area:"新橋", access:"新橋駅 烏森口 3分", budget:5000, dish:"上ミノとハラミ",
  score:5, lat:35.6659, lng:139.7562, photo:"", memo:"…" }
```

- `budget` は**ひとりあたりの目安（円）を数値で**。表示・並び替え・予算帯の絞り込みに使われます
- `lat` / `lng` は地図のピン位置。Googleマップで店を右クリック → いちばん上の座標をコピー
- `photo` に画像パス（`public/img/…` に置いて `"img/marutama.jpg"`）を入れると
  一覧のサムネイル・カーソルの札・詳細シートが写真に差し替わります。空ならジャンルの漢字
- 新しいジャンルは同ファイルの `GENRES` に、絵文字・オノマトペ（`o`）・一文字の漢字（`k`）・
  色（`tone`：`shu` 朱 / `ai` 藍 / `matcha` 抹茶 / `karashi` 芥子）を追加すれば、
  目録のタブ・図鑑・検索・地図の札に自動で反映されます

## 構成

```
src/
├── data/shops.ts          ★お店データ（運用中に触るのはここだけ）
├── layouts/Base.astro     ヘッダー/フッター/フォント/詳細シート/共通スクリプト
├── components/
│   ├── Header.astro  Footer.astro  Seal.astro（朱印ロゴ）
│   ├── Wall.astro（壁の品書き） ShopRow.astro（目録の1行） ShopSheet.astro（詳細シート）
├── pages/
│   ├── index.astro  search.astro  map.astro
├── scripts/
│   ├── motion.ts          慣性スクロールと出現アニメーションの共通ルール
│   └── sheet.ts           詳細シートの開閉・前後送り・ランダム
└── styles/global.css      デザイン
```

**一覧はビルド時にHTMLとして書き出され**、絞り込みは既存DOMの出し入れで行います。
JSが動く前から中身が見える状態です。

## デザイン

コンセプトは「**壁の品書き × 食の雑誌の目録**」。写真がなくても成立するよう、
ジャンルを一文字の漢字（麺・鮨・焼・酒・甘…）で表し、居酒屋の短冊メニューと
雑誌の索引の組版で見せています。

| 要素 | 値 |
| --- | --- |
| 紙 | 生成り `#F2EDE4`（うっすら紙の粒子） |
| 墨 | `#17140F` |
| 朱（ブランド） | `#D23C25` |
| ジャンル色 | 朱 `#D23C25` / 藍 `#24395A` / 抹茶 `#56703F` / 芥子 `#AE7E1F` |
| 見出し | しっぽり明朝 B1 800 |
| 本文 | Zen 角ゴシック New |
| 欧文・数字 | Instrument Serif（イタリック）／ IBM Plex Mono（ラベル） |

フォントはすべて `@fontsource` で同梱（Google Fonts への外部リクエストなし）。

### モーション

- [GSAP](https://gsap.com/)（無償ライセンス）＋ [Lenis](https://lenis.darkroom.engineering/)（MIT）
- 出現は「行マスク」「フェード」「スクロールで墨が入る文字」の3種だけに絞り、
  イージングは `scripts/motion.ts` の定数に統一
- 壁の短冊はスクロールの勢いで速く流れ、札が後ろに振れる（ドラッグも可）
- ページ遷移は View Transitions（対応ブラウザのみ、非対応でも普通に遷移）
- OS の「視差効果を減らす」設定時は、慣性スクロールと演出をすべて止めます

## 公開

`master` に push すると GitHub Actions が自動でビルド・デプロイします
（[.github/workflows/deploy.yml](.github/workflows/deploy.yml)）。

初回のみ GitHub の **Settings → Pages → Source** を **GitHub Actions** に変更してください
（`Deploy from a branch` のままだとワークフローの結果が反映されません）。

公開先: `https://hamachan64.github.io/umai-mise-dake/`

独自ドメインに移す場合は [astro.config.mjs](astro.config.mjs) の `site` を変えて `base` を `"/"` に。

## 地図について

Googleマップの JavaScript API はクレジットカード登録（請求先アカウント）が必須のため、
無料で維持できる **Leaflet + OpenStreetMap** を使っています。APIキーは不要です。
経路案内は各店の「Googleマップで開く」リンクからGoogle側に渡しています。

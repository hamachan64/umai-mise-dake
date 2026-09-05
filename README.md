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
  カードとモーダルが写真に差し替わります。空なら絵文字
- 新しいジャンルは同ファイルの `GENRES` に絵文字とオノマトペを追加すれば、
  トップの図鑑・検索の選択肢・地図のピンに自動で反映されます

## 構成

```
src/
├── data/shops.ts          ★お店データ（運用中に触るのはここだけ）
├── layouts/Base.astro     ヘッダー/フッター/フォント/共通スクリプト
├── components/
│   ├── Header.astro  Footer.astro  SocialRail.astro  Drop.astro
│   ├── Marquee.astro ShopCard.astro ShopModal.astro
├── pages/
│   ├── index.astro  search.astro  map.astro
├── scripts/modal.ts       モーダルの開閉（全ページ共通）
└── styles/global.css      デザイン
```

**カードはビルド時にHTMLとして書き出され**、絞り込みは既存DOMの出し入れで行います。
JSが動く前から中身が見える状態です。

ページごとのJS量:

| ページ | 読み込むJS |
| --- | --- |
| `/` | モーダル + トップの演出（約3KB） |
| `/search` | モーダルのみ（検索ロジックはHTMLにインライン） |
| `/map` | モーダル + Leaflet（約150KB。**このページだけ**） |

## デザイン

`https://henshin-j-horumon.com`（情熱ホルモン「変新」20周年サイト）を下敷きにしています。

| 要素 | 値 |
| --- | --- |
| ベース | 白 `#FFFFFF` |
| ブランドカラー | ターコイズ `#2CC1CC` / `#17A3B2` |
| アクセント | ホットピンク `#FE1958` |
| 面のカラー | クリーム `#F8F1E4`（方眼テクスチャ） |
| 見出し | Zen Kaku Gothic New 900 |
| 手書き | Caveat 700 |
| 欧文ラベル | Montserrat（大文字＋広めのトラッキング） |
| 本文 | Noto Sans JP |

白地に浮遊する切り抜き、ターコイズのしずくバッジ、大きな角丸パネル・円形マスク・
アーチ（見開き本）型のセクション区切り、ティール地に白抜きのハイライトボックス見出し。

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

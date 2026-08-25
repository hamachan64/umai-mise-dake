# うまい店だけ。

自分のオススメ飲食店をジャンル・エリア別にまとめるための、静的1ページサイトです。
フレームワーク不要、`index.html` を開くだけで動作します。

## 使い方

1. `index.html` をブラウザで開いて確認する
2. お店を追加・編集するときは `index.html` 内の `<script>` 内、
   `const SHOPS = [...]` の配列を書き換える
3. 新しいジャンルを追加したときは、同じく `<script>` 内の
   `const GENRES = {...}` に色とオノマトペを追加する

## 公開方法（GitHub Pages の例）

1. GitHub 上に新しいリポジトリを作成する（README なしで作成）
2. このフォルダの中で以下を実行する

   ```bash
   git remote add origin git@github.com:<ユーザー名>/<リポジトリ名>.git
   git branch -M main
   git push -u origin main
   ```

3. GitHubのリポジトリ → Settings → Pages で
   Branch を `main` / `/(root)` に設定して保存する
4. 数分後に `https://<ユーザー名>.github.io/<リポジトリ名>/` で公開される

## ファイル構成

```
.
├── index.html   # サイト本体（HTML/CSS/JSすべて1ファイル）
└── README.md
```

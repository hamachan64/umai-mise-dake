# LINE から投稿する Bot

LINE で Googleマップの共有リンクを送り、ボタンを数回押すだけで、店がサイトに追加されます。

```
LINE ──▶ Cloudflare Workers（このフォルダ）──▶ GitHub に1行追加してコミット ──▶ GitHub Actions がサイトを公開
                                                        └─▶ Notion にも写す（任意）
```

すべて無料の範囲で動きます。どのサービスにもクレジットカードの登録は要りません。

| サービス | 無料枠 | この Bot での使い方 |
| --- | --- | --- |
| LINE Messaging API | 返信は無制限（数えられるのはプッシュ送信だけ） | 返信だけを使うので、数えられる通数は0通 |
| Cloudflare Workers | 1日10万リクエスト | 1店の投稿で10回程度 |
| Cloudflare KV | 1日1,000回の書き込み | 下書き置き場。1店の投稿で10回程度 |

## 使い方

1. Googleマップで店を開き、**共有 → LINE → この Bot** に送る
2. 店名と最寄り駅（「〇〇駅 徒歩N分」）は自動で入ります
3. **ジャンル → 推し度 → 予算**をボタンで選ぶ（ボタンにない予算は数字で送れます）
4. **訪問日**を「今日」「昨日」「日付を選ぶ（カレンダー）」から選ぶ（「スキップ」可）。サイトには出ず、Notion にだけ記録されます
5. **一品 → メモ**を入力する（どちらも「スキップ」可）
6. **写真**を1枚送る（「写真なし」も可）
7. 確認画面で **［投稿する］** を押すと、1〜2分でサイトに反映されます

- 共有リンクの代わりに、＋ →「位置情報」で店を送っても始められます
- 途中でやめたいときは「やめる」、使い方を見たいときは「使い方」と送ってください
- 下書きは1日経つと自動で消えます
- 店名が日本語の場合、`yomi`（ローマ字表記）は空欄になります。必要なら `src/data/shops.json` を直接直してください
- 訪問日は `shops.json` の `visited` に入ります。サイトの画面には出ませんが、リポジトリが公開されているので、ファイルを開けば誰でも見られます

## セットアップ（最初の1回だけ）

手元のパソコンに [Node.js](https://nodejs.org/ja)（22以上）が入っている前提です。全部で30分ほどかかります。

### 1. GitHub のトークンを作る

Bot がこのリポジトリに書き込むための鍵です。**このリポジトリのファイルの読み書きだけ**に権限を絞ります。

1. GitHub 右上のアイコン → **Settings** → 左下 **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
2. 次のように設定する
   - Token name: `umai-mise-dake-line-bot`
   - Expiration: 1年（期限が切れたら作り直して、手順3-4の `GITHUB_TOKEN` を入れ直す）
   - Repository access: **Only select repositories** → `umai-mise-dake`
   - Permissions → Repository permissions → **Contents: Read and write**（ほかは触らない）
3. 表示されたトークン（`github_pat_…`）をメモしておく（この画面を閉じると二度と見られません）

### 2. LINE の Bot を作る

1. [LINE Developers](https://developers.line.biz/console/) に LINE アカウントでログインする
2. プロバイダーを作成し（名前は何でもよい）、**Messaging API** のチャネルを作る（画面の案内に従って LINE 公式アカウントを作ると、チャネルもできます）
3. チャネルの **チャネル基本設定** タブにある **チャネルシークレット** をメモする
4. **Messaging API設定** タブの一番下、**チャネルアクセストークン（長期）** の［発行］を押してメモする
5. 同じタブの **応答メッセージ** の［編集］から LINE Official Account Manager を開き、次のように設定する
   - 応答メッセージ：**オフ**
   - あいさつメッセージ：オフ
   - Webhook：**オン**
6. **Messaging API設定** の **グループトーク・複数人トークへの参加を許可する** はオフのままにしておく

### 3. Cloudflare に Worker を置く

1. [Cloudflare](https://dash.cloudflare.com/sign-up) に無料登録する（メールアドレスだけで可）
2. ターミナルでこのフォルダに移動し、次の順に実行する

```bash
cd line-bot
npm install
npx wrangler login                      # ブラウザが開くので「許可」
npx wrangler kv namespace create DRAFTS # 下書き置き場を作る
```

   `kv namespace create` では、途中で2つ聞かれます（wranglerのバージョンによる。聞かれなければ無視してよい）

   - `What binding name would you like to use?` → `DRAFTS` と入力する（`wrangler.jsonc` の `binding` と名前を揃える）
   - `For local dev, do you want to connect to the remote resource instead of a local resource?` → `No`（ローカルで試すときに本番の下書きデータを触らないようにするため）

3. 最後のコマンドの出力にある `"id": "…"` を、`wrangler.jsonc` の `REPLACE_WITH_YOUR_KV_ID` と差し替える
4. 秘密の値を3つ入れる。コマンドごとに `Enter a secret value:` と聞かれるので、メモした値を貼ってEnter（貼っても画面には何も表示されないが、そのままで正常）

```bash
npx wrangler secret put LINE_CHANNEL_SECRET        # 2-3 のチャネルシークレット
npx wrangler secret put LINE_CHANNEL_ACCESS_TOKEN  # 2-4 のチャネルアクセストークン
npx wrangler secret put GITHUB_TOKEN               # 1-3 の github_pat_…
```

   1回目は `There doesn't seem to be a Worker called "umai-mise-dake-line-bot". Do you want to create a new Worker with that name and add secrets to it?` と聞かれる → `Yes`。まだ一度も `deploy` していないので、空のWorkerを先に作ってそこにsecretを入れる、という確認。次の手順5の `deploy` で実際のコードに上書きされる

5. 公開する

```bash
npx wrangler deploy
```

   初回だけ `Would you like to register a workers.dev subdomain now?` と聞かれる → `Yes`。
   続けてサブドメイン名を聞かれるので、好きな英数字を入れる（アカウント内で一意であればよく、あとでCloudflareダッシュボードから変更もできる）

出力に `https://umai-mise-dake-line-bot.<あなたの名前>.workers.dev` のような URL が出ます。

### 4. LINE と Worker をつなぐ

1. LINE Developers の **Messaging API設定** → **Webhook URL** に、3-5 の URL の末尾に `/webhook` を付けたものを入れる
   - 例：`https://umai-mise-dake-line-bot.xxxx.workers.dev/webhook`
2. ［検証］を押して「成功」と出ることを確認し、**Webhookの利用** をオンにする
3. 同じタブの QR コードを LINE で読み取り、Bot を友だちに追加する
4. Bot に何か送ると、**あなたの LINE ユーザーID**（`U` で始まる文字列）が返ってくる
5. そのIDを登録する。登録した人以外が Bot に何を送っても、Bot は反応しなくなります

```bash
npx wrangler secret put ALLOWED_USER_IDS   # 4-4 のユーザーID（複数人ならカンマ区切り）
```

これで完了です。Googleマップの共有リンクを送って試してみてください。

### 5. Notion にも写す（任意）

サイトの店データ（`src/data/shops.json`）が変わるたびに、GitHub Actions が Notion「グルメリスト」へ写します。**正本は GitHub** なので、Notion で直接直した内容は、その店が次に更新されたときに上書きされます。

1. [Notion の開発者ツール](https://www.notion.so/profile/integrations) → **コネクション** → **新規コネクト** で作る
   - コネクト名：何でもよい（例：`umai-mise-dake`）
   - 認証方法：**APIトークン**（デフォルトのまま。ワークスペース専用の静的トークンで、旧UIでいう「内部インテグレーション」）
   - 作成後に表示されるシークレット（`ntn_…`）をメモする
2. Notion で「グルメリスト」DB を開き、右上 **…** → **接続** → 1 で作ったコネクトを追加する
3. 同じく **…** → **リンクをコピー** で DB の URL をコピーする
4. GitHub のリポジトリ → **Settings** → **Secrets and variables** → **Actions** → **New repository secret** で2つ登録する
   - `NOTION_TOKEN`：1 のシークレット
   - `NOTION_DATABASE_ID`：3 の URL（そのまま貼ってよい）
5. **Actions** タブ → **Sync to Notion** → **Run workflow** を、「お試し」にチェックを入れたまま実行する
6. ログに、どの項目を Notion のどの列に書くか（`列の対応`）と、追加・更新する店が出るので確認する
7. 問題なければ、「お試し」のチェックを外してもう一度実行する。以後は自動で写ります

列の対応づけについて:

- Notion の列は、名前と種類で自動的に探します。候補の名前は [`scripts/notion-sync.mjs`](../scripts/notion-sync.mjs) の `COLUMNS` にあり、列名が違うときはそこに足してください
- Notion に無い列や、種類が合わない列は書きません。選択肢（セレクト）は、Notion に既にある選択肢と同じ名前のときだけ書きます
- 訪問日は、Notion の **日付型** の「訪問日」列に書きます（列名の候補は「行った日」「来店日」「日付」も可）。訪問日が空の店は書かないので、Notion に手で入れてある日付は消えません
- 店の対応づけは店名で行います。Notion にテキスト型の **サイトID** 列を作っておくと、店名を変えても同じ店として扱えます
- サイトから消した店は、Notion からは消しません

## セキュリティ

| 心配なこと | 対策 |
| --- | --- |
| LINE 以外から偽のリクエストが来る | LINE の署名（`X-Line-Signature`）をチャネルシークレットで検証し、合わなければ捨てる |
| 他人が Bot を友だち追加して投稿する | `ALLOWED_USER_IDS` に登録した人にしか反応しない |
| GitHub のトークンが漏れる | このリポジトリのファイル読み書きだけに権限を絞り、期限も付ける。値は Cloudflare の Secrets（暗号化保存）にだけ置き、リポジトリには書かない |
| 変な値が入ってサイトが壊れる | ボタンの値も含めて Bot 側で検証する。さらにサイトのビルド時にも `shops.ts` が中身を検査し、おかしければ公開しない |
| 任意の URL を Worker に取得させられる | 辿るのは Google（maps.app.goo.gl・google.com/maps など）の URL だけ |
| 写真から撮影場所が分かってしまう | 位置情報などのメタデータを消してから保存する（写真の向きの情報だけ残す） |
| 二重に投稿される | LINE の再送は無視し、［投稿する］の連打も1回分しか処理しない |

`.dev.vars` やトークンをコミットしないよう、`.gitignore` に入れてあります。

## 開発

```bash
npm test        # テスト（LINE・GitHub・Google への通信はすべて偽物に差し替えて実行）
npm run check   # 型チェック
npm run logs    # 本番の Worker のログを見る（うまく動かないときに）
```

| ファイル | 役割 |
| --- | --- |
| `src/index.ts` | Webhook の入口。署名を検証する |
| `src/flow.ts` | 会話の流れ（下書き・ボタン・確認・投稿） |
| `src/maps.ts` | 共有リンク → 店名・座標、座標 → 最寄り駅 |
| `src/github.ts` | `shops.json` と写真を1回のコミットで書き込む |
| `src/jpeg.ts` | 写真のメタデータ削除 |
| `../src/data/choices.ts` | ジャンルと推し度の選択肢（サイトと共用） |

## うまく動かないとき

- **Bot が何も返さない**：`npm run logs` を実行したまま Bot に送り、エラーが出ていないか見る。Webhook URL の末尾が `/webhook` になっているか、応答メッセージがオフになっているかも確認する
- **店名や場所が取れない**：Googleマップの共有リンクの形式が変わった可能性があります。その場合は Bot が店名や位置情報を聞いてくるので、そのまま答えれば投稿できます
- **「投稿に失敗」「GitHub … 401」**：GitHub トークンの期限切れです。手順1で作り直し、`npx wrangler secret put GITHUB_TOKEN` で入れ直してください

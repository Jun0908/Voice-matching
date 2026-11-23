# VOICE MATCH

**見た目の前に、声でつながる。**

日本語のモバイル向けWebアプリ。左右の声を聴き比べ、5組の選択から好みを振り返ります。録音・関心・マッチングはこの端末のブラウザ内で完結します。

## Vercel

公開URL: **[https://voice-matching-kappa.vercel.app](https://voice-matching-kappa.vercel.app)**

Vercel の `voice-matching` プロジェクトを GitHub の `Jun0908/Voice-matching` に接続。`main` への Push で本番へ自動デプロイします。Next.js、Node.js 22系（`package.json`）、`npm ci` と `npm run build` を使用します。

WebアプリをHTTPSで配信しますが、録音・履歴・プロフィールは各利用者の端末に保存し、利用者同士の通信は行いません。localhostのデータは公開URLへ自動移行されません。

CLIで再デプロイする場合は、このフォルダで `vercel --prod` を実行します。`.vercelignore` はアプリのソースと採用済みデモ音声だけをアップロード対象にし、未採用音声・ローカル設定・環境変数ファイルを除外します。

## 起動

検証環境: **Node.js 22.22.1 LTS / npm 10.9.4 / Windows**。`.nvmrc`、`package.json`、`package-lock.json` を保存しています。

```powershell
Set-Location -LiteralPath 'D:\Codex\Voice Experiments\VoiceMatching'
npm ci
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開きます。外部APIキー・Python・音声生成モデルはアプリの実行に不要です。他の場所にcloneした場合は、そのフォルダで同じnpmコマンドを実行できます。

本番モード:

```powershell
npm run build
npm start
```

スマートフォンの実マイクには、端末が信頼する **HTTPS** のURLが必要です。LAN内の `http://PCのIP:3000` は画面確認に使えても、通常マイクは利用できません。PCのlocalhostは録音可能です。

## 使い方

1. 「声を聴きはじめる」で比較を開始。初回のプロフィール入力・録音は任意。
2. LEFT／RIGHTを再生。同時には一方だけが鳴り、別の側を押すと切り替わります。
3. 左／右／両方／どちらでもないを選択。5組終了後は好み分析へ。
4. 好きと答えた声をマッチ画面で見返し、「関心を送る」でデモの送信・相互成立を体験。
5. 録音画面で自己紹介または質問を選択。15〜30秒録音し、プレビューして非公開で保存。

比較の途中でも再読み込みで候補・左右・進捗が戻ります。完了後に `/` を開くと結果に移動します。新しい比較は分析画面から開始できます。非表示候補がある場合は利用可能な人数で最大5組を作ります。

## 画面

| パス | 内容 |
| --- | --- |
| `/` | 左右再生・進捗・4つの選択肢 |
| `/welcome` | コンセプト・ニックネーム・年齢・地域・希望条件 |
| `/record` | テーマ別録音・30秒自動停止・プレビュー・再録音・取消・保存 |
| `/insights` | 比較回数・選択人数・特徴タグの件数・最近の履歴 |
| `/matches` | 関心・相互成立・候補非表示・写真公開希望の端末内設定 |
| `/profile` | プロフィール・定位・公開希望・録音再生／削除・非表示解除 |

## データとデモの範囲

- 比較履歴・設定・プロフィール・関心は `localStorage`、録音Blobは `IndexedDB`。
- 自己紹介と3つの質問は別々の保存枠。保存確定まで既存録音を保持し、取消で元に戻せます。
- 録音とプロフィールは初期非公開。「公開希望」も端末内の状態であり、ネットに送信されません。
- デモは匿名Common Voice日本語読み上げ10話者。実在会員の自己紹介や交際意思を表しません。出典・CC0条件・生成手順・測定値は [音声資料](docs/AUDIO.md) と [目録](src/data/voices.json) に記録。
- 相互成立は固定の相手側デモ関心と、利用者の明示操作の両方がある場合だけ。写真素材は表示しません。
- 希望条件は保存のみで、デモ候補の絞り込みは行いません。人柄・価値観は本人の入力を参照する設計です。
- 本番アカウント、相手との通信、チャット・通話、写真の相互公開判定、AI質問生成・推薦は次段階。
- ブラウザのデータ消去・端末変更では引き継げません。複数タブで更新が競合した場合は再読み込みを案内します。

## 検証

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium webkit
npm run test:e2e
```

E2Eは本番サーバーを自動起動します。ポート3000を使用中の場合は同じアプリの本番サーバーであることを確認してください。Chromiumの録音テストは疑似マイクを使います。このWindows版WebKitは音声APIを持たないため、音声に依存する3ケースを理由付きでスキップします。

対象と結果、実機での残確認は [検証記録](docs/QA.md) を参照してください。Windows上のChromium／WebKitでのエミュレーションは、iOS Safari／Android Chrome実機の検証を代替しません。

Next.jsのシステム要件は [公式インストール資料](https://nextjs.org/docs/app/getting-started/installation) を参照。

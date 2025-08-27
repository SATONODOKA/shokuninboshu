# 職人募集アプリ

React + Vite + TailwindCSSで構築された、工務店と職人のマッチングアプリです。
LINE風のチャットUIで、案件の登録・通知・応募機能を備えています。

## 機能

- 🏢 **工務店向け機能**
  - 案件の登録・管理
  - 職人への通知送信（LINE Push API連携）
  - 応募者の確認・DM機能

- 👷 **職人向け機能**
  - 案件の閲覧・検索
  - 興味ある案件への応募
  - チャットでのコミュニケーション

- 💬 **LINE連携機能**
  - LIFF（LINE Front-end Framework）による認証
  - LINE Messaging APIによるPush通知
  - Flexメッセージでのリッチな求人情報送信

- 📱 **LINE風チャットUI**
  - リアルタイム風のメッセージ表示
  - 受信/送信メッセージの視覚的区別
  - 応募・スルーボタン

## 技術スタック

- **Frontend**: React 19, Vite, TailwindCSS
- **Backend**: Netlify Functions
- **LINE連携**: LIFF 2.0, LINE Messaging API
- **Deployment**: Netlify
- **Build Tools**: ESLint, PostCSS, Autoprefixer

## 必要な環境変数

`.env.example`をコピーして`.env`を作成し、以下の値を設定してください：

```env
# フロントエンド用（VITE_プレフィックス）
VITE_LINE_LIFF_ID=your_liff_id_here
VITE_LINE_CHANNEL_ID=your_channel_id_here  
VITE_API_BASE_URL=/.netlify/functions

# サーバーサイド用（Functionsのみ）
LINE_CHANNEL_SECRET=your_channel_secret_here
LINE_CHANNEL_ACCESS_TOKEN=your_access_token_here
```

## 開発環境のセットアップ

```bash
# 依存関係のインストール
npm install

# 初回: npm run setup:env で .env を生成→値を手入力
npm run setup:env

# .envファイルを編集して実際の値を設定
# エディタで .env を開いて各環境変数に値を設定してください

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview

# 環境変数の確認
# ブラウザで http://localhost:3001/env-check にアクセス
```

## LIFFアプリの作り方

1. [LINE Developers Console](https://developers.line.biz/ja/)でMessaging APIチャネルを作成
2. LIFF アプリを追加：
   - **エンドポイントURL**: `https://your-domain.netlify.app/liff`（本番環境の場合）
   - **スコープ**: `profile`を選択
   - **ボットリンク機能**: オンにする（任意）

## Netlifyへの設定手順

### 自動デプロイ設定
1. GitHubリポジトリをNetlifyに接続
2. ビルド設定：
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18`

### 環境変数の設定（重要）

#### 方法1: 自動同期（推奨）

**事前準備:**
1. `.env` ファイルに必要な値を設定（VITE_なしのサーバー秘匿情報も含む）
```env
VITE_LINE_LIFF_ID=your_liff_id_here
VITE_LINE_CHANNEL_ID=2008002241
VITE_API_BASE_URL=/.netlify/functions
LINE_CHANNEL_SECRET=your_channel_secret_here
LINE_CHANNEL_ACCESS_TOKEN=your_access_token_here
```

**初回のみ:**
```bash
# Netlifyにログイン
npx netlify login

# リポジトリをNetlifyサイトにリンク
npx netlify link
```

**環境変数の同期:**
```bash
# .envの内容をNetlifyに同期（自動デプロイも実行）
npm run netlify:env:sync
```

**反映確認:**
- デプロイ完了後に `https://<your-site>.netlify.app/env-check` で確認

#### 方法2: 手動設定

Netlify ダッシュボードの Environment variables で以下を設定：

```env
VITE_LINE_LIFF_ID=1234567890-abcdefgh
VITE_LINE_CHANNEL_ID=2008002241
VITE_API_BASE_URL=/.netlify/functions
LINE_CHANNEL_SECRET=your_channel_secret_here
LINE_CHANNEL_ACCESS_TOKEN=your_long_lived_access_token_here
```

**⚠️ 重要**: 
- `VITE_`で始まる環境変数のみがクライアントサイドに埋め込まれます
- アクセストークンやシークレットには`VITE_`を付けないでください
- **危険: .env を絶対コミットしない** - 秘匿情報が含まれています
- 非対話で実行したい場合は環境に `NETLIFY_AUTH_TOKEN` を用意してください

### 手動デプロイ
```bash
# ビルド
npm run build

# distディレクトリをNetlifyにアップロード
```

## 受け入れ基準・動作確認

### LIFF機能
- `/liff` をスマホのLINE内WebViewで開くと userId が表示・コピーでき、localStorageに保存される
- LIFFログインが正常に動作する

### LINE送信機能
- 「LINE送信テスト」で userId + テキストを送ると、公式LINEから自分のLINEに届く
- 求人カードの「通知を送る」でFlexが届き、jobsのnotifyCountとDMログが更新される
- Netlify環境でも同様に動作する

## プロジェクト構造

```
src/
├── components/         # Reactコンポーネント
│   ├── LineSendTestModal.tsx  # LINE送信テストモーダル
│   ├── JobCard.tsx            # 求人カード（通知送信機能付き）
│   ├── ChatUI.jsx             # チャットインターフェース
│   ├── ContractorView.jsx     # 工務店画面
│   ├── CraftsmanView.jsx      # 職人画面
│   └── TabNavigator.jsx       # タブナビゲーション
├── pages/              # ページコンポーネント
│   └── Liff.tsx               # LIFF認証・userId取得ページ
├── lib/                # ライブラリ・ユーティリティ
│   ├── lineFlex.ts            # Flexメッセージテンプレート
│   ├── data.ts                # データ管理
│   └── router.ts              # ルーティング
├── context/            # React Context
│   └── AppContext.jsx         # アプリ状態管理
└── netlify/functions/  # Netlify Functions
    └── push.ts                # LINE Push API
```

## セキュリティ注意事項

- **秘匿値は決してリポジトリにコミットしない**
- `.env` ファイルは `.gitignore` に含まれています
- `.env.example` のみをコミットしてください
- Netlify環境変数でアクセストークンを管理してください

## ライセンス

MIT License

# 職人募集アプリ

React + Vite + TailwindCSSで構築された、工務店と職人のマッチングアプリです。
LINE風のチャットUIで、案件の登録・通知・応募機能を備えています。

## 機能

- 🏢 **工務店向け機能**
  - 案件の登録・管理
  - 職人への通知送信
  - 応募者の確認

- 👷 **職人向け機能**
  - 案件の閲覧・検索
  - 興味ある案件への応募
  - チャットでのコミュニケーション

- 💬 **LINE風チャットUI**
  - リアルタイム風のメッセージ表示
  - 受信/送信メッセージの視覚的区別
  - 応募・スルーボタン

## 技術スタック

- **Frontend**: React 19, Vite, TailwindCSS
- **Deployment**: Netlify
- **Build Tools**: ESLint, PostCSS, Autoprefixer

## 開発環境のセットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

## Netlify デプロイ手順

### 自動デプロイ（推奨）
1. GitHubリポジトリをNetlifyに接続
2. 以下の設定でビルド：
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18`

### 環境変数の設定（オプション）
Netlifyダッシュボードで以下の環境変数を設定：

```env
VITE_API_BASE_URL=https://your-api-endpoint.com
VITE_APP_NAME=職人募集アプリ
VITE_ENABLE_ANALYTICS=false
```

### 手動デプロイ
```bash
# ビルド
npm run build

# distディレクトリをNetlifyにアップロード
```

## プロジェクト構造

```
src/
├── components/     # Reactコンポーネント
│   ├── ChatUI.jsx         # チャットインターフェース
│   ├── ContractorView.jsx # 工務店画面
│   ├── CraftsmanView.jsx  # 職人画面
│   └── TabNavigator.jsx   # タブナビゲーション
├── context/        # React Context
│   └── AppContext.jsx     # アプリ状態管理
└── main.jsx        # エントリーポイント
```

## ライセンス

MIT License

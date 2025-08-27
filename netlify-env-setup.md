# Netlify環境変数設定手順

## 方法1: Netlify Dashboard（Web UI）で設定

1. [Netlify Dashboard](https://app.netlify.com/) にログイン
2. 対象サイトを選択
3. **Site settings** → **Environment variables** をクリック
4. **Add a variable** で以下を1つずつ追加：

```env
# フロントエンド用（VITE_プレフィックス）
VITE_LINE_LIFF_ID=1234567890-test12345
VITE_LINE_CHANNEL_ID=2008003442
VITE_API_BASE_URL=/.netlify/functions

# サーバーサイド用（VITE_なし - 秘匿情報）
LINE_CHANNEL_SECRET=（実際のChannel Secret）
LINE_CHANNEL_ACCESS_TOKEN=（実際の長期アクセストークン）
```

**注意**: 本番環境では `VITE_API_BASE_URL=/.netlify/functions` に変更してください。

## 方法2: Netlify CLI で設定

```bash
# サイトにログイン（初回のみ）
npx netlify-cli@latest login

# 環境変数を設定
npx netlify-cli@latest env:set VITE_LINE_LIFF_ID "1234567890-test12345"
npx netlify-cli@latest env:set VITE_LINE_CHANNEL_ID "2008003442"
npx netlify-cli@latest env:set VITE_API_BASE_URL "/.netlify/functions"
npx netlify-cli@latest env:set LINE_CHANNEL_SECRET "（実際のChannel Secret）"
npx netlify-cli@latest env:set LINE_CHANNEL_ACCESS_TOKEN "（実際の長期アクセストークン）"

# 設定確認
npx netlify-cli@latest env:list
```

## 方法3: 一括設定用シェルスクリプト

```bash
#!/bin/bash
# netlify-env-setup.sh

echo "Netlify環境変数を設定します..."

# VITE_変数（公開されるのでダミー値でも可）
npx netlify-cli@latest env:set VITE_LINE_LIFF_ID "your_liff_id_here"
npx netlify-cli@latest env:set VITE_LINE_CHANNEL_ID "2008003442"
npx netlify-cli@latest env:set VITE_API_BASE_URL "/.netlify/functions"

# 秘匿情報（実際の値を入力してください）
echo "次にLINE_CHANNEL_SECRETを入力してください:"
read -s CHANNEL_SECRET
npx netlify-cli@latest env:set LINE_CHANNEL_SECRET "$CHANNEL_SECRET"

echo "次にLINE_CHANNEL_ACCESS_TOKENを入力してください:"
read -s ACCESS_TOKEN
npx netlify-cli@latest env:set LINE_CHANNEL_ACCESS_TOKEN "$ACCESS_TOKEN"

echo "設定完了! 確認..."
npx netlify-cli@latest env:list

echo "デプロイ後に https://your-site.netlify.app/env-check で動作確認してください"
```

## セキュリティ注意事項

- **VITE_**で始まる環境変数はビルド時にクライアントサイドに埋め込まれます
- **LINE_CHANNEL_SECRET** と **LINE_CHANNEL_ACCESS_TOKEN** には絶対に **VITE_** プレフィックスを付けないでください
- 秘匿情報は必ずNetlify Dashboardまたは安全な方法で設定してください

## 動作確認

設定後、以下で確認：
1. **開発環境**: http://localhost:8888/env-check
2. **本番環境**: https://your-site.netlify.app/env-check
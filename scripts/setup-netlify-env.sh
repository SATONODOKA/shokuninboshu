#!/usr/bin/env bash
set -euo pipefail

# 必要: netlify-cli
if ! command -v npx >/dev/null 2>&1; then
  echo "npx が見つかりません。Node.js/npm をインストールしてください。"; exit 1
fi

# .env 読み込み（存在しないキーは空のまま）
if [ -f ".env" ]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' .env | xargs -0 -I{} bash -c 'echo {}' 2>/dev/null || true)
else
  echo ".env が見つかりません。先に .env を作成してください。"; exit 1
fi

echo "===> Netlify ログイン（未ログインの場合のみブラウザが開きます）"
npx netlify-cli@latest login || true

echo "===> このリポジトリを Netlify サイトにリンク（未リンクの場合のみ対話が走ります）"
npx netlify-cli@latest link || true

echo "===> 環境変数を Netlify に登録します"
# フロントでも使う値は VITE_ を含むキー。Functions専用は非VITE。
# 既に同名がある場合は上書きされます。
if [ -n "${LINE_CHANNEL_ACCESS_TOKEN:-}" ]; then
  npx netlify-cli@latest env:set LINE_CHANNEL_ACCESS_TOKEN "$LINE_CHANNEL_ACCESS_TOKEN"
else
  echo "警告: LINE_CHANNEL_ACCESS_TOKEN が .env にありません。スキップします。"
fi

if [ -n "${LINE_CHANNEL_SECRET:-}" ]; then
  npx netlify-cli@latest env:set LINE_CHANNEL_SECRET "$LINE_CHANNEL_SECRET"
else
  echo "警告: LINE_CHANNEL_SECRET が .env にありません。スキップします。"
fi

if [ -n "${VITE_LINE_LIFF_ID:-}" ]; then
  npx netlify-cli@latest env:set VITE_LINE_LIFF_ID "$VITE_LINE_LIFF_ID"
fi

if [ -n "${VITE_LINE_CHANNEL_ID:-}" ]; then
  npx netlify-cli@latest env:set VITE_LINE_CHANNEL_ID "$VITE_LINE_CHANNEL_ID"
fi

# 本番は /.netlify/functions を推奨
DEFAULT_BASE='/.netlify/functions'
npx netlify-cli@latest env:set VITE_API_BASE_URL "${VITE_API_BASE_URL:-$DEFAULT_BASE}"

echo "===> 完了。Netlify の再デプロイを実行します。"
npx netlify-cli@latest deploy --prod --build

echo "★ 同期完了。/env-check で反映を確認してください。"
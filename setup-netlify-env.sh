#!/bin/bash

echo "=== Netlify環境変数設定スクリプト ==="
echo ""

# 既存のVITE_変数は設定済みの想定
echo "以下の環境変数をNetlifyに設定します:"
echo "• LINE_CHANNEL_ACCESS_TOKEN"
echo "• LINE_CHANNEL_SECRET"
echo ""

# Netlify環境変数設定
echo "📝 LINE_CHANNEL_ACCESS_TOKEN を設定中..."
npx netlify-cli@latest env:set LINE_CHANNEL_ACCESS_TOKEN "gHrKUybhgHetcwqzC6ev5/P490HeLN7M6zKbhuqLxpHCUGgiTUgmuxNFzbsJj6wy2oxKFRjtd4C1tfPUzMwW+ITqR5uGbNKjXteEy7x7dhAzEpdoKgiwTNOOb3gqHMxbQMasiS/eBVS4vbpzRmKLBQdB04t89/1O/w1cDnyilFU="

echo "📝 LINE_CHANNEL_SECRET を設定中..."
npx netlify-cli@latest env:set LINE_CHANNEL_SECRET "7a6d21f12b11923d451383d9ee9a6566"

echo ""
echo "✅ 設定完了! 現在のNetlify環境変数一覧:"
npx netlify-cli@latest env:list

echo ""
echo "🚀 設定が完了したら、Netlifyでデプロイを再実行してください"
echo "💻 デプロイ後、https://your-site.netlify.app/env-check で動作確認できます"
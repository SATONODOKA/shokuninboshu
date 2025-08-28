# Firebase セットアップガイド

## 開発者向けメモ

### 1. Firebase プロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを作成」をクリック
3. プロジェクト名を入力（例: shokuninboshu-app）
4. Google Analytics の設定は任意
5. プロジェクトの作成を完了

### 2. Firestore の有効化

1. Firebase Console でプロジェクトを開く
2. 左メニューから「Firestore Database」を選択
3. 「データベースの作成」をクリック
4. セキュリティルールは「テストモード」を選択（開発中のみ）
   - **注意**: 本番環境では適切なセキュリティルールに変更すること
5. ロケーションを選択（asia-northeast1 推奨）

### 3. Web アプリの追加

1. Firebase Console のプロジェクト概要ページで「</> ウェブ」アイコンをクリック
2. アプリのニックネームを入力（例: shokuninboshu-web）
3. 「Firebase Hosting」のセットアップは今回はスキップ
4. SDK 設定値が表示される

### 4. 環境変数の設定

SDK 設定値を `.env` ファイルに追加：

```env
VITE_FB_API_KEY=your-api-key
VITE_FB_AUTH_DOMAIN=your-auth-domain
VITE_FB_PROJECT_ID=your-project-id
VITE_FB_STORAGE_BUCKET=your-storage-bucket
VITE_FB_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FB_APP_ID=your-app-id
VITE_FB_MEASUREMENT_ID=your-measurement-id
```

### 5. 動作確認

1. ローカル環境でアプリを起動: `npm run dev`
2. ブラウザで `/env-check` にアクセス
3. Firebase セクションで全項目が「OK」になることを確認

## セキュリティに関する注意事項

### 開発中のセキュリティルール

現在は開発を容易にするため、Firestore のセキュリティルールを「テストモード」（全許可）に設定しています。
これは **2025年1月1日まで** の暫定的な設定です。

### 本番環境への移行時

本番環境では必ず以下を実施してください：

1. 適切なセキュリティルールの設定
2. Authentication の有効化と認証チェック
3. 環境変数の安全な管理（Netlify の環境変数設定など）

### セキュリティルールの適用方法

1. Firebase Console で Firestore Database → ルール を開く
2. `firestore.rules.example` の内容を参考に、適切なルールを記述
3. 「公開」ボタンでルールを適用

## トラブルシューティング

### Firebase App 初期化: NG

- `.env` ファイルに設定値が正しく記載されているか確認
- VITE_ プレフィックスが付いているか確認
- `npm run dev` でアプリを再起動

### Firestore 参照テスト: NG

- Firebase Console で Firestore が有効化されているか確認
- プロジェクト ID が正しいか確認
- ネットワーク接続を確認

## 今後の実装予定

### M2: LINE 登録フロー
- LIFF SDK の統合
- LINE ユーザー情報の Firestore 保存

### M3: データ移行
- モックデータから Firestore への完全移行
- リアルタイムデータ同期の実装

## 参考リンク

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
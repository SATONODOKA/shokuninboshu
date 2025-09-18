import React, { useState, useEffect } from 'react';
import { ensureFirebase, getFirebaseStatus, maskValue } from '../lib/firebase';

const FirebaseConfigCheck: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkFirebaseConfig();
  }, []);

  const checkFirebaseConfig = () => {
    setIsLoading(true);
    
    // 環境変数の確認
    const envVars = {
      VITE_FB_API_KEY: import.meta.env.VITE_FB_API_KEY,
      VITE_FB_AUTH_DOMAIN: import.meta.env.VITE_FB_AUTH_DOMAIN,
      VITE_FB_PROJECT_ID: import.meta.env.VITE_FB_PROJECT_ID,
      VITE_FB_STORAGE_BUCKET: import.meta.env.VITE_FB_STORAGE_BUCKET,
      VITE_FB_MESSAGING_SENDER_ID: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
      VITE_FB_APP_ID: import.meta.env.VITE_FB_APP_ID,
      VITE_FB_MEASUREMENT_ID: import.meta.env.VITE_FB_MEASUREMENT_ID,
    };

    // Firebase初期化テスト
    const firebaseResult = ensureFirebase();
    const firebaseStatus = getFirebaseStatus();

    setStatus({
      envVars,
      firebaseResult,
      firebaseStatus,
      environment: import.meta.env.MODE,
    });
    
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Firebase設定を確認中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Firebase設定確認</h1>
        
        {/* 環境情報 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">環境情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-medium">環境:</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                status.environment === 'production' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {status.environment}
              </span>
            </div>
          </div>
        </div>

        {/* 環境変数 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">環境変数</h2>
          <div className="space-y-3">
            {Object.entries(status.envVars).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">{key}:</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {value ? maskValue(value as string) : '未設定'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Firebase初期化結果 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Firebase初期化結果</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">初期化成功:</span>
              <span className={`px-2 py-1 rounded text-sm ${
                status.firebaseResult.success 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {status.firebaseResult.success ? '成功' : '失敗'}
              </span>
            </div>
            {status.firebaseResult.error && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-800 text-sm">
                  <strong>エラー:</strong> {status.firebaseResult.error}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Firebase状態 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Firebase状態</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">全設定完了:</span>
              <span className={`px-2 py-1 rounded text-sm ${
                status.firebaseStatus.allConfigured 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {status.firebaseStatus.allConfigured ? '完了' : '未完了'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Firestore利用可能:</span>
              <span className={`px-2 py-1 rounded text-sm ${
                status.firebaseStatus.firestoreAvailable 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {status.firebaseStatus.firestoreAvailable ? '利用可能' : '利用不可'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={checkFirebaseConfig}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            再確認
          </button>
        </div>
      </div>
    </div>
  );
};

export default FirebaseConfigCheck;

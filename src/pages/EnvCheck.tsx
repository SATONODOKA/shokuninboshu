import { useState, useEffect } from 'react';
import { ensureFirebase, getFirebaseStatus, maskValue } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface EnvVariable {
  key: string;
  value: string | undefined;
  isSet: boolean;
  masked?: string;
}

interface FirebaseTestResult {
  appInit: { success: boolean; error?: string };
  firestoreTest: { success: boolean; error?: string; detail?: string };
}

export default function EnvCheck() {
  const [lineEnvVars, setLineEnvVars] = useState<EnvVariable[]>([]);
  const [firebaseEnvVars, setFirebaseEnvVars] = useState<EnvVariable[]>([]);
  const [firebaseTests, setFirebaseTests] = useState<FirebaseTestResult | null>(null);
  const [isTestingFirebase, setIsTestingFirebase] = useState(false);

  useEffect(() => {
    // Check LINE environment variables
    const lineVars: EnvVariable[] = [
      {
        key: 'VITE_LINE_LIFF_ID',
        value: import.meta.env.VITE_LINE_LIFF_ID,
        isSet: !!import.meta.env.VITE_LINE_LIFF_ID,
        masked: maskValue(import.meta.env.VITE_LINE_LIFF_ID),
      },
      {
        key: 'VITE_LINE_CHANNEL_ID',
        value: import.meta.env.VITE_LINE_CHANNEL_ID,
        isSet: !!import.meta.env.VITE_LINE_CHANNEL_ID,
        masked: maskValue(import.meta.env.VITE_LINE_CHANNEL_ID),
      },
      {
        key: 'VITE_API_BASE_URL',
        value: import.meta.env.VITE_API_BASE_URL,
        isSet: !!import.meta.env.VITE_API_BASE_URL,
        masked: import.meta.env.VITE_API_BASE_URL, // Don't mask URLs
      },
    ];
    setLineEnvVars(lineVars);

    // Check Firebase environment variables
    const fbVars: EnvVariable[] = [
      {
        key: 'VITE_FB_API_KEY',
        value: import.meta.env.VITE_FB_API_KEY,
        isSet: !!import.meta.env.VITE_FB_API_KEY,
        masked: maskValue(import.meta.env.VITE_FB_API_KEY),
      },
      {
        key: 'VITE_FB_AUTH_DOMAIN',
        value: import.meta.env.VITE_FB_AUTH_DOMAIN,
        isSet: !!import.meta.env.VITE_FB_AUTH_DOMAIN,
        masked: maskValue(import.meta.env.VITE_FB_AUTH_DOMAIN),
      },
      {
        key: 'VITE_FB_PROJECT_ID',
        value: import.meta.env.VITE_FB_PROJECT_ID,
        isSet: !!import.meta.env.VITE_FB_PROJECT_ID,
        masked: maskValue(import.meta.env.VITE_FB_PROJECT_ID),
      },
      {
        key: 'VITE_FB_STORAGE_BUCKET',
        value: import.meta.env.VITE_FB_STORAGE_BUCKET,
        isSet: !!import.meta.env.VITE_FB_STORAGE_BUCKET,
        masked: maskValue(import.meta.env.VITE_FB_STORAGE_BUCKET),
      },
      {
        key: 'VITE_FB_MESSAGING_SENDER_ID',
        value: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
        isSet: !!import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
        masked: maskValue(import.meta.env.VITE_FB_MESSAGING_SENDER_ID),
      },
      {
        key: 'VITE_FB_APP_ID',
        value: import.meta.env.VITE_FB_APP_ID,
        isSet: !!import.meta.env.VITE_FB_APP_ID,
        masked: maskValue(import.meta.env.VITE_FB_APP_ID),
      },
      {
        key: 'VITE_FB_MEASUREMENT_ID',
        value: import.meta.env.VITE_FB_MEASUREMENT_ID,
        isSet: !!import.meta.env.VITE_FB_MEASUREMENT_ID,
        masked: maskValue(import.meta.env.VITE_FB_MEASUREMENT_ID),
      },
    ];
    setFirebaseEnvVars(fbVars);

    // Run Firebase tests
    testFirebase();
  }, []);

  const testFirebase = async () => {
    setIsTestingFirebase(true);
    const testResult: FirebaseTestResult = {
      appInit: { success: false },
      firestoreTest: { success: false },
    };

    try {
      // Test Firebase app initialization
      const initResult = ensureFirebase();
      testResult.appInit = {
        success: initResult.success,
        error: initResult.error,
      };

      // Test Firestore connection if app initialized successfully
      if (initResult.success && initResult.firestore) {
        try {
          const testDocRef = doc(initResult.firestore, '_meta', '_ping');
          const docSnap = await getDoc(testDocRef);
          
          if (docSnap.exists()) {
            testResult.firestoreTest = {
              success: true,
              detail: 'Document exists',
            };
          } else {
            testResult.firestoreTest = {
              success: true,
              detail: 'Document not created (OK)',
            };
          }
        } catch (firestoreError: any) {
          const errorMessage = firestoreError?.message || 'Unknown error';
          // Check for common Firestore errors
          if (errorMessage.includes('Failed to get document')) {
            testResult.firestoreTest = {
              success: true,
              detail: 'Firestore connected (document not found)',
            };
          } else if (errorMessage.includes('PERMISSION_DENIED')) {
            testResult.firestoreTest = {
              success: false,
              error: 'Permission denied. Check security rules.',
            };
          } else if (errorMessage.includes('not enabled')) {
            testResult.firestoreTest = {
              success: false,
              error: 'Firestore not enabled in Firebase Console.',
            };
          } else {
            testResult.firestoreTest = {
              success: false,
              error: errorMessage.substring(0, 60) + (errorMessage.length > 60 ? '...' : ''),
            };
          }
        }
      } else {
        testResult.firestoreTest = {
          success: false,
          error: 'Firebase not initialized',
        };
      }
    } catch (error: any) {
      testResult.appInit = {
        success: false,
        error: error?.message || 'Unknown error',
      };
    }

    setFirebaseTests(testResult);
    setIsTestingFirebase(false);
  };

  const getStatusBadge = (isSet: boolean) => {
    return isSet ? (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        設定済み
      </span>
    ) : (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
        未設定
      </span>
    );
  };

  const getTestStatusBadge = (success: boolean) => {
    return success ? (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        OK
      </span>
    ) : (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
        NG
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">環境変数チェック</h1>
          <p className="text-gray-600">アプリケーションの環境設定状態を確認します</p>
        </header>

        {/* LINE Configuration */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">LINE設定</h2>
          <div className="space-y-2">
            {lineEnvVars.map((envVar) => (
              <div key={envVar.key} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm">{envVar.key}</span>
                  {getStatusBadge(envVar.isSet)}
                </div>
                <span className="text-sm text-gray-600 font-mono">
                  {envVar.masked}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Firebase Configuration */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Firebase設定</h2>
          <div className="space-y-2">
            {firebaseEnvVars.map((envVar) => (
              <div key={envVar.key} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm">{envVar.key}</span>
                  {getStatusBadge(envVar.isSet)}
                </div>
                <span className="text-sm text-gray-600 font-mono">
                  {envVar.masked}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Firebase Status */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Firebase/Firestore ステータス</h2>
          
          {isTestingFirebase ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
              <p className="mt-2 text-gray-600">テスト中...</p>
            </div>
          ) : firebaseTests ? (
            <div className="space-y-4">
              {/* App Initialization */}
              <div className="flex items-start justify-between py-3 px-4 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <span className="font-medium">Firebase App 初期化:</span>
                  {getTestStatusBadge(firebaseTests.appInit.success)}
                </div>
                {firebaseTests.appInit.error && (
                  <span className="text-xs text-red-600 max-w-md truncate">
                    {firebaseTests.appInit.error}
                  </span>
                )}
              </div>

              {/* Firestore Test */}
              <div className="flex items-start justify-between py-3 px-4 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <span className="font-medium">Firestore 参照テスト:</span>
                  {getTestStatusBadge(firebaseTests.firestoreTest.success)}
                  {firebaseTests.firestoreTest.detail && (
                    <span className="text-xs text-gray-600">
                      ({firebaseTests.firestoreTest.detail})
                    </span>
                  )}
                </div>
                {firebaseTests.firestoreTest.error && (
                  <span className="text-xs text-red-600 max-w-md truncate">
                    {firebaseTests.firestoreTest.error}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              テスト結果がありません
            </div>
          )}

          <div className="mt-4">
            <button
              onClick={testFirebase}
              disabled={isTestingFirebase}
              className="bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              再テスト
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">設定について</div>
              <ul className="space-y-1 text-xs">
                <li>• 環境変数は .env ファイルに設定してください</li>
                <li>• Firebase の設定値は Firebase Console から取得できます</li>
                <li>• 本番環境では Netlify の環境変数に設定する必要があります</li>
                <li>• セキュリティのため、値は部分的にマスクして表示しています</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
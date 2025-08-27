import React, { useState, useEffect } from 'react';
import { useRouter } from '../lib/router';
import { validateEnvironmentVariables, getValidationSummary, ENV_CONFIGS } from '../lib/envValidation';

export default function EnvCheck() {
  const { navigate } = useRouter();
  const [functionStatus, setFunctionStatus] = useState<any>(null);
  const [functionError, setFunctionError] = useState<string>('');

  useEffect(() => {
    // Functions のヘルスチェック
    const checkFunctions = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/.netlify/functions';
        const response = await fetch(`${apiBaseUrl}/env-check`);
        if (response.ok) {
          const data = await response.json();
          setFunctionStatus(data);
        } else {
          setFunctionError(`HTTP ${response.status}`);
        }
      } catch (error: any) {
        setFunctionError(error.message);
      }
    };

    checkFunctions();
  }, []);

  const maskValue = (value: string) => {
    if (!value || value.length <= 4) return value;
    return '*'.repeat(value.length - 4) + value.slice(-4);
  };

  const validationSummary = getValidationSummary();
  const envResults = validationSummary.results;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">環境変数チェック</h1>
            <p className="text-gray-600">現在の環境変数とNetlify Functionsの状態を確認できます</p>
            
            {/* Validation Summary */}
            <div className={`mt-4 p-4 rounded-lg border ${
              validationSummary.isValid 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  validationSummary.isValid
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {validationSummary.isValid ? '設定OK' : 'エラーあり'}
                </span>
                <span className="ml-2 text-sm">
                  {validationSummary.errors.length > 0 && 
                    `${validationSummary.errors.length}個のエラー`}
                  {validationSummary.hasWarnings && 
                    ` (${validationSummary.warnings.length}個の警告)`}
                </span>
              </div>
            </div>
          </div>

          {/* フロントエンド環境変数 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">フロントエンド環境変数 (VITE_)</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      キー
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      値
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      説明
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状態
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {envResults.map((result) => {
                    const config = ENV_CONFIGS.find(c => c.key === result.key)!;
                    return (
                    <tr key={result.key}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {result.key}
                        {result.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                        {result.value ? maskValue(result.value) : '(未設定)'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {config.description}
                        {result.error && (
                          <div className="text-red-500 text-xs mt-1">{result.error}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          result.isValid 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {result.isValid ? '正常' : 'エラー'}
                        </span>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Netlify Functions状態 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Netlify Functions 状態</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              {functionError ? (
                <div className="text-red-600">
                  <span className="font-medium">エラー:</span> {functionError}
                </div>
              ) : functionStatus ? (
                <div>
                  <div className="flex items-center mb-2">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      接続OK
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      {functionStatus.timestamp}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>Functions利用可能:</strong> {functionStatus.functions_available ? 'はい' : 'いいえ'}</p>
                    <p><strong>LINE_CHANNEL_ACCESS_TOKEN:</strong> {functionStatus.env_configured?.LINE_CHANNEL_ACCESS_TOKEN ? '設定済み' : '未設定'}</p>
                    <p><strong>LINE_CHANNEL_SECRET:</strong> {functionStatus.env_configured?.LINE_CHANNEL_SECRET ? '設定済み' : '未設定'}</p>
                  </div>
                </div>
              ) : (
                <div className="text-gray-600">
                  <span className="inline-flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                    Functions接続確認中...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 操作ボタン */}
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              ダッシュボードに戻る
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              再読み込み
            </button>
          </div>

          {/* 注意事項 */}
          <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>注意:</strong> VITE_で始まる環境変数はビルド時にクライアントサイドに埋め込まれるため、
                  ブラウザからも見えます。秘匿情報（アクセストークンなど）にはVITE_プレフィックスを使わないでください。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
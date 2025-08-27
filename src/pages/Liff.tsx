import React, { useState, useEffect } from 'react';
import { useRouter } from '../lib/router';

declare global {
  interface Window {
    liff: any;
  }
}

interface Profile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

export default function Liff() {
  const { navigate } = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    initializeLiff();
  }, []);

  const initializeLiff = async () => {
    try {
      const liffId = import.meta.env.VITE_LINE_LIFF_ID;
      if (!liffId) {
        setError('LIFF ID が設定されていません');
        setIsLoading(false);
        return;
      }

      await window.liff.init({ liffId });

      if (!window.liff.isLoggedIn()) {
        window.liff.login();
        return;
      }

      const profile = await window.liff.getProfile();
      setProfile(profile);
      
      // LocalStorageに保存
      localStorage.setItem('lineUserId', profile.userId);
      
      setIsLoading(false);
    } catch (err: any) {
      console.error('LIFF initialization failed:', err);
      setError(err.message || 'LIFF の初期化に失敗しました');
      setIsLoading(false);
    }
  };

  const copyUserId = async () => {
    if (profile?.userId) {
      try {
        await navigator.clipboard.writeText(profile.userId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-center">LIFF を初期化しています...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-center mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">エラーが発生しました</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="block w-full bg-blue-500 text-white text-center py-2 px-4 rounded hover:bg-blue-600 transition-colors"
          >
            ダッシュボードに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">LINE 連携</h1>
            <p className="text-gray-600">あなたのLINE情報を確認できます</p>
          </div>

          {profile && (
            <div className="space-y-4">
              {profile.pictureUrl && (
                <div className="text-center">
                  <img 
                    src={profile.pictureUrl} 
                    alt="プロフィール画像" 
                    className="w-20 h-20 rounded-full mx-auto border-4 border-gray-200"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">表示名</label>
                <div className="bg-gray-50 p-3 rounded border">
                  {profile.displayName}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ユーザーID</label>
                <div className="flex gap-2">
                  <div className="bg-gray-50 p-3 rounded border flex-1 font-mono text-sm break-all">
                    {profile.userId}
                  </div>
                  <button
                    onClick={copyUserId}
                    className={`px-4 py-2 rounded text-white transition-colors ${
                      copied 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    {copied ? '✓' : 'コピー'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  このIDを使って通知を受け取ることができます
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 space-y-3">
            <button 
              onClick={() => navigate('/')}
              className="block w-full bg-blue-500 text-white text-center py-3 px-4 rounded hover:bg-blue-600 transition-colors"
            >
              ダッシュボードに戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface LineSendTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LineSendTestModal({ isOpen, onClose }: LineSendTestModalProps) {
  const [userId, setUserId] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const savedUserId = localStorage.getItem('lineUserId');
      if (savedUserId) {
        setUserId(savedUserId);
      }
      setMessage('テストメッセージです。');
      setResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!userId.trim() || !message.trim()) {
      setResult({ success: false, message: 'ユーザーIDとメッセージを入力してください' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/.netlify/functions';
      const response = await fetch(`${apiBaseUrl}/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userId.trim(),
          messages: [{ type: 'text', text: message.trim() }]
        })
      });

      const responseData = await response.text();
      
      if (response.ok) {
        setResult({ success: true, message: '送信が完了しました！' });
      } else {
        setResult({ 
          success: false, 
          message: `送信に失敗しました (${response.status}): ${responseData}` 
        });
      }
    } catch (error: any) {
      setResult({ 
        success: false, 
        message: `エラーが発生しました: ${error.message}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">LINE送信テスト</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
              送信先ユーザーID
            </label>
            <input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
            <p className="text-xs text-gray-500 mt-1">
              LIFF画面で取得したユーザーIDを入力してください
            </p>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              メッセージ
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="送信したいメッセージを入力してください"
            />
          </div>

          {result && (
            <div className={`p-3 rounded-md ${
              result.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.message}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSend}
              disabled={isLoading}
              className={`flex-1 px-4 py-2 rounded-md text-white font-medium transition-colors ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isLoading ? '送信中...' : '送信する'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500">
              💡 まず <a href="/liff" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">LIFF画面</a> でユーザーIDを取得してからお試しください
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
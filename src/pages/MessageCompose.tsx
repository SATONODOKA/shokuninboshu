import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Job, Worker } from '../types';
import { mockJobs } from '../data/jobs';
import { mockWorkers } from '../data/workers';
import { useSearchParams, generateJobTemplate, countCharacters, maskUserId } from '../utils/helpers';

export default function MessageCompose() {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const ids = searchParams.get('ids')?.split(',').filter(Boolean) || [];
  
  const [job, setJob] = useState<Job | null>(null);
  const [selectedWorkers, setSelectedWorkers] = useState<Worker[]>([]);
  const [message, setMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const maxCharacters = 500;

  useEffect(() => {
    // Load job data
    const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
    const foundJob = jobs.find((j: Job) => j.id === jobId) || mockJobs.find(j => j.id === jobId);
    setJob(foundJob || null);
    
    // Load selected workers
    const workers = mockWorkers.filter(w => ids.includes(w.id));
    setSelectedWorkers(workers);
    
    // Generate initial message template
    if (foundJob) {
      const template = generateJobTemplate(foundJob);
      setMessage(template);
    }
  }, [jobId, ids.join(',')]);

  const handleSendConfirmation = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmedSend = async () => {
    setIsLoading(true);
    setShowConfirmModal(false);

    // Mock sending process
    const payload = {
      jobId,
      ids,
      message,
      timestamp: new Date().toISOString()
    };

    console.log('送信処理（モック）:', payload);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update job notify count
    if ((window as any).updateJobNotifyCount) {
      (window as any).updateJobNotifyCount(jobId);
    }

    // Show success toast
    showSuccessToast();

    // Navigate back to job list
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  const showSuccessToast = () => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
    toast.textContent = '送信処理（モック）を実行しました';
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  if (!job || selectedWorkers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600 mb-4">データの読み込みに失敗しました</h2>
          <button 
            onClick={() => navigate('/')}
            className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg"
          >
            求人一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  const characterCount = countCharacters(message);
  const isOverLimit = characterCount > maxCharacters;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="text-teal-600 hover:text-teal-700 flex items-center gap-2"
            >
              ← 候補者リストに戻る
            </button>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">メッセージ作成</h1>
            <div className="flex items-center justify-between">
              <div className="text-lg text-gray-700">
                『{job.title}｜{job.startDate}〜{job.endDate}｜{job.salaryBand}』
              </div>
              <div className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-medium">
                送信対象: {selectedWorkers.length}名
              </div>
            </div>
          </div>
        </div>

        {/* Message Composition */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メッセージ内容
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={`w-full h-64 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 resize-none ${
                isOverLimit 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-teal-500'
              }`}
              placeholder="メッセージを入力してください..."
            />
            <div className="flex justify-between items-center mt-2 text-sm">
              <div className={`${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
                {characterCount} / {maxCharacters} 文字
              </div>
              {isOverLimit && (
                <div className="text-red-500">文字数制限を超えています</div>
              )}
            </div>
          </div>

          <button
            onClick={handleSendConfirmation}
            disabled={!message.trim() || isOverLimit || isLoading}
            className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {isLoading ? '送信中...' : '送信確認'}
          </button>
        </div>

        {/* Target Workers Preview */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">送信対象者 ({selectedWorkers.length}名)</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedWorkers.slice(0, 10).map(worker => (
              <div key={worker.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{worker.name}</span>
                  <span className="text-sm text-gray-500">{worker.trade}</span>
                  <span className="text-sm text-gray-500">{worker.pref}-{worker.city}</span>
                </div>
                <span className="text-xs font-mono text-gray-400">{maskUserId(worker.id)}</span>
              </div>
            ))}
            {selectedWorkers.length > 10 && (
              <div className="text-center text-gray-500 text-sm py-2">
                他 {selectedWorkers.length - 10} 名
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                この内容で {selectedWorkers.length} 名に送信します
              </h3>
              
              <div className="mb-6">
                <div className="bg-gray-50 rounded p-3 text-sm text-gray-700 max-h-32 overflow-y-auto">
                  {message}
                </div>
              </div>

              <div className="mb-4 text-sm text-gray-600">
                <div className="font-medium mb-2">送信対象:</div>
                <div className="space-y-1">
                  {selectedWorkers.slice(0, 3).map(worker => (
                    <div key={worker.id} className="flex justify-between">
                      <span>{worker.name} ({worker.trade})</span>
                      <span className="font-mono text-xs">{maskUserId(worker.id)}</span>
                    </div>
                  ))}
                  {selectedWorkers.length > 3 && (
                    <div className="text-gray-500 text-center">
                      他 {selectedWorkers.length - 3} 名
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleConfirmedSend}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-4 rounded-lg"
                >
                  送信を確定
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
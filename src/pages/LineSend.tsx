import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Job } from '../types';
import { buildJobFlex } from '../lib/lineFlex';

export default function LineSend() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId');
  
  const [job, setJob] = useState<Job | null>(null);
  const [lineUserId, setLineUserId] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!jobId) {
      navigate('/');
      return;
    }

    // Load job data
    const storedJobs = localStorage.getItem('jobs');
    if (storedJobs) {
      const jobs: Job[] = JSON.parse(storedJobs);
      const foundJob = jobs.find(j => j.id === jobId);
      if (foundJob) {
        setJob(foundJob);
        setMessage(`【${foundJob.trade}】${foundJob.pref}${foundJob.city}の募集案件です。\n\n期間: ${foundJob.startDate} 〜 ${foundJob.endDate}\n給与: ${foundJob.salaryBand}\n\n${foundJob.summary || ''}\n\nご興味がございましたらお気軽にお返事ください。`);
      }
    }
  }, [jobId, navigate]);

  const handleSend = async () => {
    if (!lineUserId.trim() || !message.trim() || !job) return;

    setIsLoading(true);
    setSendStatus('idle');

    try {
      // Create flex message
      const flexMessage = buildJobFlex({
        trade: job.trade,
        sitePref: job.pref,
        siteCity: job.city,
        startDate: job.startDate,
        endDate: job.endDate,
        salaryBand: job.salaryBand,
        summary: job.summary,
        tel: '03-1234-5678' // You might want to make this configurable
      });

      // Send via Netlify Function
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '/.netlify/functions';
      const response = await fetch(`${apiUrl}/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: lineUserId.trim(),
          messages: [
            { type: 'text', text: message.trim() },
            flexMessage
          ]
        })
      });

      if (response.ok) {
        setSendStatus('success');
        
        // Update notification count
        if ((window as any).updateJobNotifyCount) {
          (window as any).updateJobNotifyCount(jobId);
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    } catch (error: any) {
      console.error('Send failed:', error);
      setSendStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-4">求人情報を読み込み中...</div>
          <button
            onClick={handleBack}
            className="text-teal-600 hover:text-teal-700"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center text-teal-600 hover:text-teal-700 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            求人一覧に戻る
          </button>
          <h1 className="text-3xl font-bold text-gray-800">LINE送信</h1>
          <p className="text-gray-600 mt-2">職人さんに求人案内をLINEで送信します</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">送信する求人</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="font-medium text-gray-800">{job.title}</div>
            <div className="text-sm text-gray-600 mt-1">
              {job.startDate} 〜 {job.endDate} | {job.salaryBand}
            </div>
            {job.summary && (
              <div className="text-sm text-gray-600 mt-2">{job.summary}</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              送信先 LINE ユーザーID
            </label>
            <input
              type="text"
              value={lineUserId}
              onChange={(e) => setLineUserId(e.target.value)}
              placeholder="例: U1234567890abcdef..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              相手のLINE ユーザーIDを入力してください
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メッセージ
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="職人さんに送るメッセージを入力してください..."
            />
          </div>

          {sendStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-800 font-medium">送信完了しました！</span>
              </div>
            </div>
          )}

          {sendStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-red-800 font-medium">送信に失敗しました。もう一度お試しください。</span>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleBack}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSend}
              disabled={!lineUserId.trim() || !message.trim() || isLoading}
              className="flex-1 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  送信中...
                </>
              ) : (
                'LINE送信'
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">送信について</div>
              <ul className="space-y-1 text-xs">
                <li>• テキストメッセージと求人カードの2つのメッセージが送信されます</li>
                <li>• 相手がBotを友達追加していない場合、メッセージは届きません</li>
                <li>• 送信が完了すると求人の通知回数がカウントされます</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
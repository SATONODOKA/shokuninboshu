import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Job } from '../types';
import { formatDate } from '../utils/helpers';

export default function JobList() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    // Load jobs from localStorage only (no mock data by default)
    const storedJobs = localStorage.getItem('jobs');
    if (storedJobs) {
      setJobs(JSON.parse(storedJobs));
    }
  }, []);

  const handleRecruit = (jobId: string) => {
    navigate(`/recruit/targets?jobId=${jobId}`);
  };

  const updateJobNotifyCount = (jobId: string) => {
    setJobs(prev => {
      const updated = prev.map(job => 
        job.id === jobId 
          ? { ...job, notifyCount: (job.notifyCount || 0) + 1 }
          : job
      );
      localStorage.setItem('jobs', JSON.stringify(updated));
      return updated;
    });
  };

  const handleEdit = (job: Job) => {
    navigate(`/job/create?edit=${job.id}`);
  };

  const handleDelete = (jobId: string) => {
    if (window.confirm('この求人を削除しますか？')) {
      const updated = jobs.filter(job => job.id !== jobId);
      setJobs(updated);
      localStorage.setItem('jobs', JSON.stringify(updated));
    }
  };

  const handleToggleStatus = (jobId: string, newStatus: 'OPEN' | 'PAUSED' | 'COMPLETED') => {
    setJobs(prev => {
      const updated = prev.map(job => 
        job.id === jobId ? { ...job, status: newStatus } : job
      );
      localStorage.setItem('jobs', JSON.stringify(updated));
      return updated;
    });
  };

  const handleTogglePublish = (jobId: string) => {
    setJobs(prev => {
      const updated = prev.map(job => 
        job.id === jobId ? { ...job, isPublished: !job.isPublished } : job
      );
      localStorage.setItem('jobs', JSON.stringify(updated));
      return updated;
    });
  };

  const handleCreateNew = () => {
    navigate('/job/create');
  };

  // Make updateJobNotifyCount available globally for MessageCompose
  useEffect(() => {
    (window as any).updateJobNotifyCount = updateJobNotifyCount;
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">求人一覧</h1>
              <p className="text-gray-600">募集中の案件一覧です。「職人を募集」ボタンから候補者に連絡できます。</p>
            </div>
            <button
              onClick={handleCreateNew}
              className="bg-teal-500 hover:bg-teal-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              求人を作成
            </button>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map(job => (
            <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
              {/* Status badges */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  job.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                  job.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {job.status === 'OPEN' ? '募集中' : job.status === 'PAUSED' ? '一時停止' : '完了'}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  job.isPublished ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                }`}>
                  {job.isPublished ? '公開中' : '非公開'}
                </span>
              </div>

              {/* Job Title */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{job.title}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>{formatDate(job.startDate)} 〜 {formatDate(job.endDate)}</div>
                  <div className="font-medium text-teal-600">{job.salaryBand}</div>
                </div>
              </div>

              {/* Summary */}
              {job.summary && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{job.summary}</p>
              )}

              {/* KPI Section */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-gray-500">必要:</span>
                    <span className="font-medium ml-1">{job.need}名</span>
                  </div>
                  <div>
                    <span className="text-gray-500">決定:</span>
                    <span className="font-medium ml-1 text-green-600">{job.decided}名</span>
                  </div>
                  <div>
                    <span className="text-gray-500">通知:</span>
                    <span className="font-medium ml-1 text-blue-600">{job.notifyCount || 0}回</span>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (job.decided / job.need) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {job.status === 'OPEN' && job.isPublished && (
                  <button
                    onClick={() => handleRecruit(job.id)}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    職人を募集
                  </button>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleEdit(job)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded text-sm transition-colors"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(job.id)}
                    className="bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-3 rounded text-sm transition-colors"
                  >
                    削除
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {job.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleToggleStatus(job.id, job.status === 'OPEN' ? 'PAUSED' : 'OPEN')}
                      className={`font-medium py-2 px-3 rounded text-sm transition-colors ${
                        job.status === 'OPEN' 
                          ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                          : 'bg-green-100 hover:bg-green-200 text-green-700'
                      }`}
                    >
                      {job.status === 'OPEN' ? '一時停止' : '再開'}
                    </button>
                  )}
                  
                  {job.status !== 'COMPLETED' ? (
                    <button
                      onClick={() => handleToggleStatus(job.id, 'COMPLETED')}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded text-sm transition-colors"
                    >
                      完了
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleStatus(job.id, 'OPEN')}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-3 rounded text-sm transition-colors"
                    >
                      再開
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleTogglePublish(job.id)}
                  className={`w-full font-medium py-2 px-4 rounded-lg text-sm transition-colors ${
                    job.isPublished 
                      ? 'bg-red-100 hover:bg-red-200 text-red-700'
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                  }`}
                >
                  {job.isPublished ? '非公開にする' : '公開する'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {jobs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">募集中の案件がありません</h3>
            <p className="text-gray-500">新しい案件を作成してください。</p>
          </div>
        )}
      </div>
    </div>
  );
}
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
              <div className="flex items-center gap-6 mb-4">
                <h1 className="text-3xl font-bold text-gray-800">求人管理</h1>
                <nav className="flex gap-4">
                  <button className="text-teal-600 border-b-2 border-teal-600 pb-1 font-medium">
                    募集中
                  </button>
                  <button 
                    onClick={() => navigate('/jobs/completed')}
                    className="text-gray-500 hover:text-gray-700 pb-1 font-medium"
                  >
                    完了済み
                  </button>
                </nav>
              </div>
              <p className="text-gray-600">募集中の案件一覧です。「募集」ボタンから候補者に連絡できます。</p>
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
          {jobs.filter(job => job.status !== 'COMPLETED').map(job => (
            <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
              {/* Publication status badge in top-left corner */}
              <div className="absolute top-4 left-4">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  job.isPublished 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {job.isPublished ? '公開中' : '非公開'}
                </span>
              </div>

              {/* Edit and Delete buttons in top-right corner */}
              <div className="absolute top-4 right-4 flex gap-1">
                <button
                  onClick={() => handleEdit(job)}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center transition-colors"
                  title="編集"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(job.id)}
                  className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center transition-colors"
                  title="削除"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Job Title */}
              <div className="mb-4 mt-8">
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
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleTogglePublish(job.id)}
                  className={`font-medium py-2 px-3 rounded text-sm transition-colors ${
                    job.isPublished 
                      ? 'bg-red-100 hover:bg-red-200 text-red-700'
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                  }`}
                >
                  {job.isPublished ? '非公開' : '公開'}
                </button>
                <button
                  onClick={() => handleRecruit(job.id)}
                  className="bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-3 rounded text-sm transition-colors"
                >
                  募集
                </button>
                <button
                  onClick={() => handleToggleStatus(job.id, 'COMPLETED')}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded text-sm transition-colors"
                >
                  完了
                </button>
              </div>
            </div>
          ))}
        </div>

        {jobs.filter(job => job.status !== 'COMPLETED').length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-6">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-3">まだ求人がありません</h3>
            <p className="text-gray-500 mb-6">右上の「求人を作成」ボタンから最初の求人を作成してください。</p>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              求人を作成
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
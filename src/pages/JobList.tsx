import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Job } from '../types';
import { mockJobs } from '../data/jobs';
import { formatDate } from '../utils/helpers';

export default function JobList() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    // Load jobs from localStorage or use mock data
    const storedJobs = localStorage.getItem('jobs');
    if (storedJobs) {
      setJobs(JSON.parse(storedJobs));
    } else {
      setJobs(mockJobs);
      localStorage.setItem('jobs', JSON.stringify(mockJobs));
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

  // Make updateJobNotifyCount available globally for MessageCompose
  useEffect(() => {
    (window as any).updateJobNotifyCount = updateJobNotifyCount;
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">求人一覧</h1>
          <p className="text-gray-600">募集中の案件一覧です。「職人を募集」ボタンから候補者に連絡できます。</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map(job => (
            <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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

              {/* Action Button */}
              <button
                onClick={() => handleRecruit(job.id)}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                職人を募集
              </button>
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
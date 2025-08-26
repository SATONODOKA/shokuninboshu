import { useState, useEffect } from 'react';
import type { Job, Application } from '../types';
import { getArray, upsertItemById } from '../lib/storage';
import { formatDate } from '../utils/dates';

interface JobSectionsProps {
  section: 'in-progress' | 'completed';
  onJobDetail: (job: Job) => void;
}

export default function JobSections({ section, onJobDetail }: JobSectionsProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allJobs = getArray('jobs');
    const allApplications = getArray('applications');
    
    const statusFilter = section === 'in-progress' ? 'IN_PROGRESS' : 'CLOSED';
    setJobs(allJobs.filter((job: Job) => job.status === statusFilter)
      .sort((a: Job, b: Job) => b.lastUpdatedAt - a.lastUpdatedAt));
    setApplications(allApplications);
  };

  const handleCompleteJob = (job: Job) => {
    if (confirm('この求人を完了にしますか？')) {
      const updatedJob = {
        ...job,
        status: 'CLOSED' as const,
        lastUpdatedAt: Date.now()
      };
      upsertItemById('jobs', updatedJob);
      loadData();
    }
  };

  const getJobApplications = (jobId: string) => {
    return applications.filter(app => app.jobId === jobId);
  };

  const getHiredApplicants = (jobId: string) => {
    return applications.filter(app => app.jobId === jobId && app.status === 'HIRED');
  };

  const getStatusBadge = (status: Job['status']) => {
    const styles = {
      OPEN: 'bg-green-100 text-green-800',
      PAUSED: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      CLOSED: 'bg-gray-100 text-gray-800'
    };
    
    const labels = {
      OPEN: '募集中',
      PAUSED: '一時停止',
      IN_PROGRESS: '進行中',
      CLOSED: '完了'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const title = section === 'in-progress' ? '進行中の案件' : '完了した案件';

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>

      <div className="space-y-4">
        {jobs.map((job) => {
          const jobApplications = getJobApplications(job.id);
          const hiredApplicants = getHiredApplicants(job.id);
          
          return (
            <div key={job.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{job.trade}</h3>
                    {getStatusBadge(job.status)}
                  </div>
                  
                  <p className="text-gray-600 mb-3">{job.summary}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">場所：</span>
                      {job.sitePref}・{job.siteCity}
                    </div>
                    <div>
                      <span className="font-medium">期間：</span>
                      {formatDate(job.startDate)} 〜 {formatDate(job.endDate)}
                    </div>
                    <div>
                      <span className="font-medium">給与：</span>
                      {job.salaryBand}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">人数：</span>
                      <span className="text-blue-600 font-medium">
                        {job.headcountFilled}/{job.headcountNeeded}人
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">応募者数：</span>
                      {jobApplications.length}人
                    </div>
                    <div>
                      <span className="font-medium">採用者数：</span>
                      {hiredApplicants.length}人
                    </div>
                  </div>

                  {/* 採用者一覧 */}
                  {hiredApplicants.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">採用者:</h4>
                      <div className="flex flex-wrap gap-2">
                        {hiredApplicants.map((app) => (
                          <span
                            key={app.id}
                            className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                          >
                            {app.applicantName}
                            {app.applicantTrade && ` (${app.applicantTrade})`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mt-3">
                    最終更新: {new Date(job.lastUpdatedAt).toLocaleString('ja-JP')}
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => onJobDetail(job)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    詳細
                  </button>
                  
                  {section === 'in-progress' && (
                    <button
                      onClick={() => handleCompleteJob(job)}
                      className="px-3 py-1 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors"
                    >
                      完了にする
                    </button>
                  )}
                </div>
              </div>

              {/* プログレスバー */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">進捗</span>
                  <span className="text-sm text-gray-600">
                    {Math.round((job.headcountFilled / job.headcountNeeded) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      job.headcountFilled === job.headcountNeeded ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{
                      width: `${Math.min((job.headcountFilled / job.headcountNeeded) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {jobs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {section === 'in-progress' ? '進行中の案件はありません' : '完了した案件はありません'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
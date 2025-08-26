import { useState, useEffect } from 'react';
import type { Job, Application } from '../types';
import { getArray, upsertItemById, removeItemById, pushItem } from '../lib/storage';
import { computeStartDeadline, formatDate } from '../utils/dates';
import { generateId } from '../lib/ids';

interface JobBoardProps {
  onCreateNew: () => void;
  onJobDetail: (job: Job) => void;
  onEditJob: (job: Job) => void;
}

export default function JobBoard({ onCreateNew, onJobDetail, onEditJob }: JobBoardProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [sortBy, setSortBy] = useState<'lastUpdated' | 'startDate'>('lastUpdated');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setJobs(getArray('jobs'));
    setApplications(getArray('applications'));
  };

  const handleNotify = (job: Job) => {
    const updatedJob = {
      ...job,
      notifyCount: job.notifyCount + 1,
      lastUpdatedAt: Date.now()
    };
    upsertItemById('jobs', updatedJob);
    
    pushItem('jobChats', {
      id: generateId(),
      jobId: job.id,
      role: 'system',
      text: `募集通知を送信しました（${job.notifyCount + 1}回目）`,
      createdAt: Date.now()
    });
    
    loadData();
  };

  const handleTogglePublish = (job: Job) => {
    const updatedJob = {
      ...job,
      stopPublish: !job.stopPublish,
      lastUpdatedAt: Date.now()
    };
    upsertItemById('jobs', updatedJob);
    loadData();
  };

  const handleCloseJob = (job: Job) => {
    const updatedJob = {
      ...job,
      status: 'CLOSED' as const,
      lastUpdatedAt: Date.now()
    };
    upsertItemById('jobs', updatedJob);
    loadData();
  };

  const handleDeleteJob = (job: Job) => {
    if (confirm('求人を削除しますか？関連するデータもすべて削除されます。')) {
      removeItemById('jobs', job.id);
      
      // 関連するApplicationsを削除
      const jobApplications = applications.filter(app => app.jobId === job.id);
      jobApplications.forEach(app => removeItemById('applications', app.id));
      
      // 関連するJobChatsを削除
      const jobChats = getArray('jobChats').filter((chat: any) => chat.jobId === job.id);
      jobChats.forEach((chat: any) => removeItemById('jobChats', chat.id));
      
      loadData();
    }
  };

  const getJobApplications = (jobId: string) => {
    return applications.filter(app => app.jobId === jobId);
  };

  const getSortedJobs = () => {
    let filtered = jobs;
    
    if (filterStatus !== 'all') {
      filtered = jobs.filter(job => job.status === filterStatus.toUpperCase());
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'lastUpdated') {
        return b.lastUpdatedAt - a.lastUpdatedAt;
      } else {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }
    });
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">求人ボード</h2>
        <button
          onClick={onCreateNew}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <span className="mr-2">➕</span>
          新規募集
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">並び替え</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'lastUpdated' | 'startDate')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="lastUpdated">最終更新</option>
            <option value="startDate">開始日</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">すべて</option>
            <option value="open">募集中</option>
            <option value="paused">一時停止</option>
            <option value="in_progress">進行中</option>
            <option value="closed">完了</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {getSortedJobs().map((job) => {
          const jobApplications = getJobApplications(job.id);
          const deadline = computeStartDeadline(job.startDate, job.startByDeadlineDays);
          
          return (
            <div key={job.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{job.trade}</h3>
                    {getStatusBadge(job.status)}
                    {job.stopPublish && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        非公開
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-2">{job.summary}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mt-2">
                    <div>
                      <span className="font-medium">人数：</span>
                      <span className="text-blue-600 font-medium">
                        {job.headcountFilled}/{job.headcountNeeded}人
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">着手期限：</span>
                      {formatDate(deadline)}
                    </div>
                    <div>
                      <span className="font-medium">通知回数：</span>
                      {job.notifyCount}回
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 mt-2">
                    応募者数: {jobApplications.length}人
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 ml-4">
                  <button
                    onClick={() => onJobDetail(job)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    詳細
                  </button>
                  
                  <button
                    onClick={() => onEditJob(job)}
                    className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                  >
                    編集
                  </button>

                  <button
                    onClick={() => handleNotify(job)}
                    disabled={job.status === 'CLOSED'}
                    className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors disabled:opacity-50"
                  >
                    通知を送る
                  </button>

                  <button
                    onClick={() => handleTogglePublish(job)}
                    disabled={job.status === 'CLOSED'}
                    className={`px-3 py-1 text-sm rounded transition-colors disabled:opacity-50 ${
                      job.stopPublish 
                        ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700' 
                        : 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                    }`}
                  >
                    {job.stopPublish ? '公開再開' : '公開停止'}
                  </button>

                  <button
                    onClick={() => handleCloseJob(job)}
                    disabled={job.status === 'CLOSED'}
                    className="px-3 py-1 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors disabled:opacity-50"
                  >
                    クローズ
                  </button>

                  <button
                    onClick={() => handleDeleteJob(job)}
                    className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {getSortedJobs().length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">求人がありません</p>
            <button
              onClick={onCreateNew}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              最初の求人を作成
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
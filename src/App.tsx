import { useState, useEffect } from 'react';
import { PlusIcon, BellIcon } from '@heroicons/react/24/outline';
import { Job, Thread } from './types';
import { IconButton } from './components/IconButton';
import { JobCard } from './components/JobCard';
import { ThreadList } from './components/ThreadList';
import { CreateJobModal } from './components/CreateJobModal';
import { getJobs, getThreads } from './lib/data';

function App() {
  const [activeTab, setActiveTab] = useState<'jobs' | 'dm'>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [showCreateJob, setShowCreateJob] = useState(false);

  useEffect(() => {
    setJobs(getJobs());
    setThreads(getThreads());
  }, []);

  const handleJobCreated = (newJob: Job) => {
    setJobs(prev => [...prev, newJob]);
  };

  const handleJobDeleted = (id: string) => {
    setJobs(prev => prev.filter(job => job.id !== id));
  };

  const handleJobUpdated = (updatedJob: Job) => {
    setJobs(prev => prev.map(job => job.id === updatedJob.id ? updatedJob : job));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="min-h-screen">
        <header className="bg-brand px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">職人募集</h1>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-brand-hover transition-colors">
                <BellIcon className="h-5 w-5 text-white" />
              </button>
              {activeTab === 'jobs' && (
                <button 
                  onClick={() => setShowCreateJob(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-brand rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <PlusIcon className="h-5 w-5" />
                  新規作成
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('jobs')}
                className={`py-3 px-1 font-medium border-b-3 transition-colors ${
                  activeTab === 'jobs'
                    ? 'border-brand text-brand'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
                style={{borderBottomWidth: '3px'}}
              >
                求人管理
              </button>
              <button
                onClick={() => setActiveTab('dm')}
                className={`py-3 px-1 font-medium border-b-3 transition-colors relative ${
                  activeTab === 'dm'
                    ? 'border-brand text-brand'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
                style={{borderBottomWidth: '3px'}}
              >
                メッセージ
                {threads.some(t => t.unreadCount > 0) && (
                  <span className="absolute -top-1 -right-3 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-6 py-6">
            {activeTab === 'jobs' ? (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {jobs.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500 mb-4 text-lg">まだ求人がありません</p>
                    <button 
                      onClick={() => setShowCreateJob(true)}
                      className="inline-flex items-center px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      求人を作成
                    </button>
                  </div>
                ) : (
                  jobs.map(job => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      onDeleted={handleJobDeleted}
                      onUpdated={handleJobUpdated}
                    />
                  ))
                )}
              </div>
            ) : (
              <div className="max-w-4xl">
                <ThreadList threads={threads} />
              </div>
            )}
          </div>
        </main>

        {showCreateJob && (
          <CreateJobModal 
            onClose={() => setShowCreateJob(false)} 
            onJobCreated={handleJobCreated}
          />
        )}
      </div>
    </div>
  );
}

export default App;
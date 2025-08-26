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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <header className="bg-white border-b border-ui-line px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-ink-900">職人募集</h1>
            <div className="flex items-center gap-2">
              <IconButton>
                <BellIcon className="h-5 w-5" />
              </IconButton>
              {activeTab === 'jobs' && (
                <IconButton variant="primary" onClick={() => setShowCreateJob(true)}>
                  <PlusIcon className="h-5 w-5" />
                </IconButton>
              )}
            </div>
          </div>
        </header>

        <div className="border-b border-ui-line">
          <div className="flex">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`flex-1 py-3 text-center font-medium border-b-2 transition-colors ${
                activeTab === 'jobs'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-ink-600 hover:text-ink-800'
              }`}
            >
              求人
            </button>
            <button
              onClick={() => setActiveTab('dm')}
              className={`flex-1 py-3 text-center font-medium border-b-2 transition-colors relative ${
                activeTab === 'dm'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-ink-600 hover:text-ink-800'
              }`}
            >
              DM
              {threads.some(t => t.unreadCount > 0) && (
                <span className="absolute top-1 right-1/4 w-2 h-2 bg-state-err rounded-full"></span>
              )}
            </button>
          </div>
        </div>

        <main className="flex-1">
          {activeTab === 'jobs' ? (
            <div className="p-4 space-y-3">
              {jobs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-ink-500 mb-4">まだ求人がありません</p>
                  <IconButton 
                    variant="primary" 
                    onClick={() => setShowCreateJob(true)}
                    className="px-6 py-2"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    求人を作成
                  </IconButton>
                </div>
              ) : (
                jobs.map(job => (
                  <JobCard key={job.id} job={job} />
                ))
              )}
            </div>
          ) : (
            <ThreadList threads={threads} />
          )}
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
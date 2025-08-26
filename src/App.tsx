import { useState, useEffect } from 'react';
import { PlusIcon, BellIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { Job, Thread } from './types';
import { IconButton } from './components/IconButton';
import { JobCard } from './components/JobCard';
import { ThreadList } from './components/ThreadList';
import { CreateJobModal } from './components/CreateJobModal';
import { EditJobModal } from './components/EditJobModal';
import { Monitor } from './components/Monitor';
import { TestMonitor } from './components/TestMonitor';
import { DmThreadView } from './components/DmThreadView';
import { getJobs, getThreads } from './lib/data';
import { useRouter } from './lib/router';
import { bus } from './lib/bus';

function App() {
  const { path, navigate } = useRouter();
  const [activeTab, setActiveTab] = useState<'jobs' | 'dm'>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [isMonitorMode, setIsMonitorMode] = useState(false);

  useEffect(() => {
    // Check URL parameters for monitor mode - client-side only
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setIsMonitorMode(urlParams.get('mode') === 'monitor');
    }

    setJobs(getJobs());
    setThreads(getThreads());
  }, []);

  useEffect(() => {
    const handleApplicationAdded = (event: any) => {
      if (event.type === 'APPLICATION_ADDED') {
        const message = `${event.data.applicantName}さんが「${event.data.jobTitle}」に${event.data.status === 'DECLINED' ? '応募を辞退しました' : '応募しました'}`;
        setNotifications(prev => [...prev, message]);
        
        // Update threads list
        setThreads(getThreads());
        
        // Auto-remove notification after 5 seconds
        setTimeout(() => {
          setNotifications(prev => prev.slice(1));
        }, 5000);
      }
    };

    bus.on('APPLICATION_ADDED', handleApplicationAdded);
    return () => bus.off('APPLICATION_ADDED', handleApplicationAdded);
  }, []);

  // If we're in monitor mode, show the monitor
  if (isMonitorMode) {
    try {
      return <Monitor />;
    } catch (error) {
      console.error('Monitor component error:', error);
      return (
        <div style={{ padding: '20px', backgroundColor: 'red', color: 'white' }}>
          <h1>Monitor エラー</h1>
          <p>エラー: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      );
    }
  }

  // If we're on the monitor route, show the monitor
  if (path === '/monitor') {
    return <Monitor />;
  }

  const handleJobCreated = (newJob: Job) => {
    setJobs(prev => [...prev, newJob]);
  };

  const handleJobDeleted = (id: string) => {
    setJobs(prev => prev.filter(job => job.id !== id));
  };

  const handleJobUpdated = (updatedJob: Job) => {
    setJobs(prev => prev.map(job => job.id === updatedJob.id ? updatedJob : job));
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
  };

  const handleSelectThread = (threadId: string) => {
    setSelectedThread(threadId);
  };

  // If a DM thread is selected, show the thread view
  if (selectedThread && activeTab === 'dm') {
    return (
      <div className="min-h-screen bg-gray-50">
        <DmThreadView 
          threadId={selectedThread}
          onBack={() => setSelectedThread(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="min-h-screen">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">職人募集</h1>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => window.open('/?mode=monitor', '_blank')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-sm"
              >
                <ComputerDesktopIcon className="h-5 w-5 text-white" />
                モニターを開く
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <BellIcon className="h-5 w-5 text-gray-600" />
              </button>
              {activeTab === 'jobs' && (
                <button 
                  onClick={() => setShowCreateJob(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors font-medium shadow-sm"
                  style={{backgroundColor: '#1BA3A3'}}
                >
                  <PlusIcon className="h-5 w-5 text-white" />
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
                      onEdit={handleEditJob}
                      onDeleted={handleJobDeleted}
                      onUpdated={handleJobUpdated}
                    />
                  ))
                )}
              </div>
            ) : (
              <div className="max-w-4xl">
                <ThreadList threads={threads} onSelectThread={handleSelectThread} />
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

        {editingJob && (
          <EditJobModal 
            job={editingJob}
            onClose={() => setEditingJob(null)} 
            onJobUpdated={handleJobUpdated}
          />
        )}
      </div>

      {/* Notification Toast */}
      {notifications.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000
        }}>
          {notifications.map((notification, index) => (
            <div
              key={index}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                maxWidth: '300px',
                animation: 'slideIn 0.3s ease-out'
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                🎉 新しい応募
              </div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>
                {notification}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
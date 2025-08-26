import { Job, Application, Thread, Message } from '../types';
import { generateId } from './ids';

const STORAGE_KEYS = {
  JOBS: 'shokuninboshu_jobs',
  APPLICATIONS: 'shokuninboshu_applications', 
  THREADS: 'shokuninboshu_threads',
  MESSAGES: 'shokuninboshu_messages'
} as const;

function safeLocalStorage() {
  try {
    if (typeof window === 'undefined') {
      return null;
    }
    return window.localStorage;
  } catch (error) {
    console.warn('localStorage not available:', error);
    return null;
  }
}

function getStorageData<T>(key: string): T[] {
  const storage = safeLocalStorage();
  if (!storage) return [];
  
  try {
    const data = storage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setStorageData<T>(key: string, data: T[]): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  
  try {
    storage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

export function getJobs(): Job[] {
  return getStorageData<Job>(STORAGE_KEYS.JOBS);
}

export function createJob(jobData: Omit<Job, 'id' | 'createdAt' | 'lastUpdatedAt' | 'notifyCount' | 'headcountFilled'>): Job {
  const jobs = getJobs();
  const newJob: Job = {
    ...jobData,
    id: generateId(),
    headcountFilled: 0,
    status: 'OPEN',
    notifyCount: 0,
    createdAt: Date.now(),
    lastUpdatedAt: Date.now()
  };
  
  jobs.push(newJob);
  setStorageData(STORAGE_KEYS.JOBS, jobs);
  return newJob;
}

export function updateJob(id: string, updates: Partial<Job>): Job | null {
  const jobs = getJobs();
  const index = jobs.findIndex(job => job.id === id);
  
  if (index === -1) return null;
  
  jobs[index] = {
    ...jobs[index],
    ...updates,
    lastUpdatedAt: Date.now()
  };
  
  setStorageData(STORAGE_KEYS.JOBS, jobs);
  return jobs[index];
}

export function deleteJob(id: string): boolean {
  const jobs = getJobs();
  const filteredJobs = jobs.filter(job => job.id !== id);
  
  if (filteredJobs.length === jobs.length) return false;
  
  setStorageData(STORAGE_KEYS.JOBS, filteredJobs);
  return true;
}

export function getApplications(): Application[] {
  return getStorageData<Application>(STORAGE_KEYS.APPLICATIONS);
}

export function getApplicationsForJob(jobId: string): Application[] {
  return getApplications().filter(app => app.jobId === jobId);
}

export function createApplication(appData: Omit<Application, 'id' | 'createdAt'>): Application {
  const applications = getApplications();
  const newApp: Application = {
    ...appData,
    id: generateId(),
    createdAt: Date.now()
  };
  
  applications.push(newApp);
  setStorageData(STORAGE_KEYS.APPLICATIONS, applications);
  return newApp;
}

export function getThreads(): Thread[] {
  return getStorageData<Thread>(STORAGE_KEYS.THREADS);
}

export function createThread(threadData: Omit<Thread, 'id' | 'lastMessageAt' | 'hasReply' | 'unreadCount'>): Thread {
  const threads = getThreads();
  const newThread: Thread = {
    ...threadData,
    id: generateId(),
    lastMessageAt: Date.now(),
    hasReply: false,
    unreadCount: 0
  };
  
  threads.push(newThread);
  setStorageData(STORAGE_KEYS.THREADS, threads);
  return newThread;
}

export function updateThread(id: string, updates: Partial<Thread>): Thread | null {
  const threads = getThreads();
  const index = threads.findIndex(thread => thread.id === id);
  
  if (index === -1) return null;
  
  threads[index] = {
    ...threads[index],
    ...updates
  };
  
  setStorageData(STORAGE_KEYS.THREADS, threads);
  return threads[index];
}

export function getMessages(): Message[] {
  return getStorageData<Message>(STORAGE_KEYS.MESSAGES);
}

export function getMessagesForThread(threadId: string): Message[] {
  return getMessages()
    .filter(msg => msg.threadId === threadId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function createMessage(msgData: Omit<Message, 'id' | 'createdAt'>): Message {
  const messages = getMessages();
  const newMessage: Message = {
    ...msgData,
    id: generateId(),
    createdAt: Date.now()
  };
  
  messages.push(newMessage);
  setStorageData(STORAGE_KEYS.MESSAGES, messages);
  
  // Update thread with latest message
  const threads = getThreads();
  const threadIndex = threads.findIndex(t => t.id === msgData.threadId);
  if (threadIndex !== -1) {
    threads[threadIndex] = {
      ...threads[threadIndex],
      lastMessageText: msgData.text,
      lastMessageAt: newMessage.createdAt,
      hasReply: msgData.role === 'contractor',
      unreadCount: msgData.role === 'worker' ? threads[threadIndex].unreadCount + 1 : threads[threadIndex].unreadCount
    };
    setStorageData(STORAGE_KEYS.THREADS, threads);
  }
  
  return newMessage;
}
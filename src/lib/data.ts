import { Job, Application, Thread, Message } from '../types';
import { generateId } from './ids';
import { bus } from './bus';

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
  
  // Emit event for monitor
  bus.emit('JOB_PUBLISHED', {
    id: newJob.id,
    title: newJob.summary,
    trade: newJob.trade,
    location: `${newJob.sitePref}${newJob.siteCity}`
  });
  
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
  
  // Get job details for event
  const job = getJobs().find(j => j.id === appData.jobId);
  
  // Only create DM thread for actual applications (not declines)
  if (appData.status === 'APPLIED') {
    // Create DM thread for this application
    const thread = createThread({
      jobId: appData.jobId,
      counterpartName: appData.applicantName,
      contactTel: appData.phone,
      contactLineId: appData.lineId,
      lastMessageText: `${appData.applicantName}さんから応募がありました。`,
    });
    
    // Create initial message
    createMessage({
      threadId: thread.id,
      jobId: appData.jobId,
      role: 'system',
      text: `${appData.applicantName}さんから「${job?.summary || 'Unknown Job'}」への応募がありました。${appData.note ? `メモ: ${appData.note}` : ''}`
    });
  }
  
  // Emit event for monitor
  bus.emit('APPLICATION_ADDED', {
    applicationId: newApp.id,
    jobId: newApp.jobId,
    jobTitle: job?.summary || 'Unknown Job',
    applicantName: newApp.applicantName,
    status: newApp.status
  });
  
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

// Additional functions for monitor system
export function updateApplicationStatus(id: string, status: Application['status']): Application | null {
  const applications = getApplications();
  const index = applications.findIndex(app => app.id === id);
  
  if (index === -1) return null;
  
  const oldStatus = applications[index].status;
  applications[index] = {
    ...applications[index],
    status
  };
  
  setStorageData(STORAGE_KEYS.APPLICATIONS, applications);
  
  // Get job details for event
  const job = getJobs().find(j => j.id === applications[index].jobId);
  
  // Emit event for monitor
  bus.emit('APP_STATUS_CHANGED', {
    applicationId: id,
    jobId: applications[index].jobId,
    jobTitle: job?.summary || 'Unknown Job',
    applicantName: applications[index].applicantName,
    oldStatus,
    status
  });
  
  return applications[index];
}

export function getThreadById(id: string): (Thread & { messages: Array<{content: string, sender: string, timestamp: string}>, applicantName: string, jobTitle: string }) | null {
  const thread = getThreads().find(t => t.id === id);
  if (!thread) return null;
  
  const job = getJobs().find(j => j.id === thread.jobId);
  const messages = getMessagesForThread(id).map(msg => ({
    content: msg.text,
    sender: msg.role,
    timestamp: new Date(msg.createdAt).toISOString()
  }));
  
  return {
    ...thread,
    messages,
    applicantName: thread.counterpartName,
    jobTitle: job?.summary || 'Unknown Job',
    lastMessage: messages[messages.length - 1] || { content: '', sender: 'system', timestamp: new Date().toISOString() }
  };
}

export function addMessage(threadId: string, messageData: { content: string, sender: string, timestamp: string }): any {
  // Find the thread to get jobId
  const threads = getThreads();
  const thread = threads.find(t => t.id === threadId);
  
  if (!thread) {
    console.error('Thread not found:', threadId);
    return null;
  }
  
  const message = createMessage({
    threadId,
    jobId: thread.jobId,
    role: messageData.sender as any,
    text: messageData.content
  });
  
  const threadWithDetails = getThreadById(threadId);
  
  // Emit event for monitor
  const eventType = messageData.sender === 'contractor' ? 'DM_SENT' : 'DM_REPLY';
  bus.emit(eventType, {
    threadId,
    message: messageData,
    jobTitle: threadWithDetails?.jobTitle || 'Unknown Job',
    applicantName: threadWithDetails?.applicantName || 'Unknown User'
  });
  
  return messageData;
}
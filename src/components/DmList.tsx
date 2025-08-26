import { useState, useEffect } from 'react';
import { ChatBubbleLeftRightIcon, UserIcon } from '@heroicons/react/24/outline';
import { bus, BusEvent } from '../lib/bus';
import { getThreads } from '../lib/data';

interface DmListProps {
  onSelectThread: (threadId: string) => void;
}

export const DmList = ({ onSelectThread }: DmListProps) => {
  const [threads, setThreads] = useState(() => getThreads());
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});


  useEffect(() => {
    const handleEvent = (event: BusEvent) => {
      if (event.type === 'DM_SENT' || event.type === 'DM_REPLY') {
        setThreads(getThreads());
        
        const threadId = event.data.threadId;
        if (threadId) {
          setUnreadCounts(prev => ({
            ...prev,
            [threadId]: (prev[threadId] || 0) + 1
          }));
        }
      }
    };

    bus.on('DM_SENT', handleEvent);
    bus.on('DM_REPLY', handleEvent);

    return () => {
      bus.off('DM_SENT', handleEvent);
      bus.off('DM_REPLY', handleEvent);
    };
  }, []);

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'たった今';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}時間前`;
    
    return new Date(timestamp).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleThreadClick = (threadId: string) => {
    setUnreadCounts(prev => ({
      ...prev,
      [threadId]: 0
    }));
    onSelectThread(threadId);
  };

  if (threads.length === 0) {
    return (
      <div className="text-center py-12">
        <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">DMはありません</p>
        <p className="text-xs text-gray-400 mt-2">応募が発生するとDMスレッドが作成されます</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {threads
        .sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime())
        .map((thread) => {
          const unreadCount = unreadCounts[thread.id] || 0;
          
          return (
            <div
              key={thread.id}
              onClick={() => handleThreadClick(thread.id)}
              className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-gray-400" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {thread.jobTitle}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {formatTime(new Date(thread.lastMessage.timestamp).getTime())}
                    </span>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 truncate mt-1">
                  {thread.lastMessage.sender === 'contractor' ? 'あなた: ' : '職人: '}
                  {thread.lastMessage.content}
                </p>
                
                <p className="text-xs text-gray-500 mt-1">
                  応募者: {thread.applicantName}
                </p>
              </div>
            </div>
          );
        })}
    </div>
  );
};
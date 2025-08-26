import { Thread } from '../types';
import { fromNow } from '../utils/dates';
import { getJobs } from '../lib/data';

interface ThreadListProps {
  threads: Thread[];
  onSelectThread?: (threadId: string) => void;
}

export function ThreadList({ threads, onSelectThread }: ThreadListProps) {
  const jobs = getJobs();

  if (threads.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">DMがありません</p>
        <p className="text-gray-400 text-sm mt-2">LINEからの応募があるとDMが表示されます</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="divide-y divide-gray-200">
        {threads.map(thread => {
          const job = jobs.find(j => j.id === thread.jobId);
          return (
            <div 
              key={thread.id} 
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onSelectThread?.(thread.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{thread.counterpartName}</h3>
                    {thread.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                  {job && (
                    <div className="text-xs text-teal-600 font-medium mt-1">
                      {job.summary} ({job.trade})
                    </div>
                  )}
                  {(thread.contactTel || thread.contactLineId) && (
                    <div className="text-xs text-gray-500 mt-1">
                      {thread.contactTel && <span>TEL: {thread.contactTel}</span>}
                      {thread.contactTel && thread.contactLineId && <span> • </span>}
                      {thread.contactLineId && <span>LINE: {thread.contactLineId}</span>}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-500">{fromNow(thread.lastMessageAt)}</span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{thread.lastMessageText}</p>
              {thread.hasReply && (
                <div className="flex items-center gap-1 mt-2">
                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                  <span className="text-xs text-teal-600 font-medium">返信済み</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
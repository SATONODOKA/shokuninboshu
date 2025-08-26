import { Thread } from '../types';
import { fromNow } from '../utils/dates';

interface ThreadListProps {
  threads: Thread[];
}

export function ThreadList({ threads }: ThreadListProps) {
  if (threads.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-ink-500">メッセージがありません</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-ui-line">
      {threads.map(thread => (
        <div key={thread.id} className="p-4 hover:bg-gray-50 cursor-pointer">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-ink-900">{thread.counterpartName}</h3>
                {thread.unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-state-err rounded-full">
                    {thread.unreadCount}
                  </span>
                )}
              </div>
              {(thread.contactTel || thread.contactLineId) && (
                <div className="text-xs text-ink-500 mt-1">
                  {thread.contactTel && <span>TEL: {thread.contactTel}</span>}
                  {thread.contactTel && thread.contactLineId && <span> • </span>}
                  {thread.contactLineId && <span>LINE: {thread.contactLineId}</span>}
                </div>
              )}
            </div>
            <span className="text-xs text-ink-500">{fromNow(thread.lastMessageAt)}</span>
          </div>
          <p className="text-sm text-ink-600 line-clamp-2">{thread.lastMessageText}</p>
          {thread.hasReply && (
            <div className="flex items-center gap-1 mt-2">
              <div className="w-2 h-2 bg-brand rounded-full"></div>
              <span className="text-xs text-brand font-medium">返信済み</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
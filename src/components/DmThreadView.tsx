import { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeftIcon, 
  PaperAirplaneIcon, 
  UserIcon 
} from '@heroicons/react/24/outline';
import { bus, BusEvent } from '../lib/bus';
import { getThreadById, addMessage } from '../lib/data';

interface DmThreadViewProps {
  threadId: string;
  onBack: () => void;
}

export const DmThreadView = ({ threadId, onBack }: DmThreadViewProps) => {
  const [thread, setThread] = useState(() => getThreadById(threadId));
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState(() => {
    const threadData = getThreadById(threadId);
    return threadData?.messages || [];
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleEvent = (event: BusEvent) => {
      if ((event.type === 'DM_SENT' || event.type === 'DM_REPLY') && event.data.threadId === threadId) {
        const updatedThread = getThreadById(threadId);
        setThread(updatedThread);
        setMessages(updatedThread?.messages || []);
      }
    };

    bus.on('DM_SENT', handleEvent);
    bus.on('DM_REPLY', handleEvent);

    return () => {
      bus.off('DM_SENT', handleEvent);
      bus.off('DM_REPLY', handleEvent);
    };
  }, [threadId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading || !thread) return;

    setIsLoading(true);
    try {
      // addMessage will emit DM_SENT event which will update the UI via event listener
      addMessage(threadId, {
        content: message.trim(),
        sender: 'contractor',
        timestamp: new Date().toISOString()
      });

      setMessage('');

    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!thread) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">スレッドが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <h1 className="text-sm font-medium text-gray-900">{thread.applicantName}</h1>
              <p className="text-xs text-gray-500">{thread.jobTitle}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.sender === 'contractor' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              msg.sender === 'contractor'
                ? 'bg-teal-500 text-white'
                : msg.sender === 'system'
                ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                : 'bg-white border border-gray-200 text-gray-900'
            }`}>
              <p className="text-sm">{msg.content}</p>
              <p className={`text-xs mt-1 ${
                msg.sender === 'contractor' 
                  ? 'text-teal-100' 
                  : msg.sender === 'system'
                  ? 'text-yellow-600'
                  : 'text-gray-500'
              }`}>
                {formatTime(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="メッセージを入力..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="p-2 bg-teal-500 hover:bg-teal-600 text-white rounded-full transition-colors disabled:bg-gray-300"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};
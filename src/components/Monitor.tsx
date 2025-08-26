import { useState, useEffect } from 'react';
import { BellIcon, ChatBubbleLeftRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import { bus, BusEvent } from '../lib/bus';
import { NotificationFeed } from './NotificationFeed';
import { DmList } from './DmList';
import { DmThreadView } from './DmThreadView';
import { createApplication, deleteUserData, addMessage, getThreadById } from '../lib/data';

interface LineMessage {
  id: string;
  type: 'job_notification' | 'application_response' | 'user_message' | 'contractor_message';
  timestamp: number;
  jobData?: {
    id: string;
    title: string;
    trade: string;
    location: string;
    salary: string;
    period: string;
  };
  responseData?: {
    jobId: string;
    response: 'apply' | 'decline';
    applicantName: string;
  };
  messageData?: {
    threadId?: string;
    content: string;
    sender: string;
  };
}

const STORAGE_KEYS = {
  LINE_MESSAGES: 'line_mock_messages',
  LINE_THREADS: 'line_mock_threads'
} as const;

export const Monitor = () => {
  const [messages, setMessages] = useState<LineMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LINE_MESSAGES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [applicantName, setApplicantName] = useState('田中太郎');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [userMessage, setUserMessage] = useState('');

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LINE_MESSAGES, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    // Delete 佐藤花子's data on first load
    deleteUserData('佐藤花子');

    const handleJobNotification = (event: BusEvent) => {
      if (event.type === 'JOB_PUBLISHED') {
        const newMessage: LineMessage = {
          id: 'msg-' + Date.now(),
          type: 'job_notification',
          timestamp: Date.now(),
          jobData: {
            id: event.data.id,
            title: event.data.title,
            trade: event.data.trade,
            location: event.data.location,
            salary: event.data.salary || '応相談',
            period: event.data.period || '応相談'
          }
        };
        setMessages(prev => [...prev, newMessage]);
      }
    };

    const handleDmReceived = (event: BusEvent) => {
      // Only receive messages from contractor (DM_SENT), not our own replies (DM_REPLY)
      if (event.type === 'DM_SENT' && event.data.threadId) {
        const newMessage: LineMessage = {
          id: 'msg-' + Date.now(),
          type: 'contractor_message',
          timestamp: Date.now(),
          messageData: {
            threadId: event.data.threadId,
            content: event.data.message.content,
            sender: 'contractor'
          }
        };
        setMessages(prev => [...prev, newMessage]);
      }
    };

    bus.on('JOB_PUBLISHED', handleJobNotification);
    bus.on('DM_SENT', handleDmReceived);
    
    return () => {
      bus.off('JOB_PUBLISHED', handleJobNotification);
      bus.off('DM_SENT', handleDmReceived);
    };
  }, []);

  const handleJobResponse = (jobId: string, response: 'apply' | 'decline') => {
    const responseMessage: LineMessage = {
      id: 'response-' + Date.now(),
      type: 'application_response',
      timestamp: Date.now(),
      responseData: {
        jobId,
        response,
        applicantName
      }
    };

    setMessages(prev => [...prev, responseMessage]);

    // Create actual application record
    const app = createApplication({
      jobId,
      applicantName,
      phone: '090-1234-5678',
      lineId: `line_${applicantName.slice(0, 2)}`,
      note: response === 'apply' ? 'LINEから応募' : 'LINEから辞退',
      status: response === 'apply' ? 'APPLIED' : 'REJECTED'
    });

    // If applied, set active thread for message sync
    if (response === 'apply') {
      // Find the thread that was created for this application
      setTimeout(() => {
        const threads = JSON.parse(localStorage.getItem('shokuninboshu_threads') || '[]');
        const thread = threads.find((t: any) => t.counterpartName === applicantName && t.jobId === jobId);
        if (thread) {
          setActiveThreadId(thread.id);
        }
      }, 100);
    }

    setTimeout(() => {
      alert(response === 'apply' ? '応募を送信しました！' : '応募を辞退しました。');
    }, 500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMessage.trim() || !activeThreadId) return;

    // Add message to LINE chat
    const newMessage: LineMessage = {
      id: 'msg-' + Date.now(),
      type: 'user_message',
      timestamp: Date.now(),
      messageData: {
        threadId: activeThreadId,
        content: userMessage.trim(),
        sender: 'worker'
      }
    };

    setMessages(prev => [...prev, newMessage]);

    // Send to DM system
    addMessage(activeThreadId, {
      content: userMessage.trim(),
      sender: 'worker',
      timestamp: new Date().toISOString()
    });

    setUserMessage('');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1a1a1a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* LINE Header */}
      <div style={{
        backgroundColor: '#00b900',
        color: 'white',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          marginRight: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          color: '#00b900',
          fontWeight: 'bold'
        }}>
          企
        </div>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>職人募集システム</div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>求人情報をお届けします</div>
        </div>
      </div>

      {/* Chat Area */}
      <div style={{
        padding: '16px',
        minHeight: 'calc(100vh - 64px)',
        backgroundColor: '#f5f5f5',
        paddingBottom: activeThreadId ? '80px' : '16px'
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#999'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>💼</div>
            <p>求人情報が送信されるのを待っています...</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              ダッシュボードで「通知」ボタンを押してください
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} style={{ marginBottom: '16px' }}>
            {message.type === 'job_notification' && message.jobData && (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                maxWidth: '400px'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: '#666',
                  marginBottom: '8px'
                }}>
                  {formatTime(message.timestamp)}
                </div>
                
                <div style={{
                  backgroundColor: '#f0f8ff',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#333',
                    marginBottom: '8px'
                  }}>
                    🔨 {message.jobData.trade}の募集
                  </div>
                  <div style={{ marginBottom: '6px', color: '#555' }}>
                    <strong>案件:</strong> {message.jobData.title}
                  </div>
                  <div style={{ marginBottom: '6px', color: '#555' }}>
                    <strong>場所:</strong> {message.jobData.location}
                  </div>
                  <div style={{ marginBottom: '6px', color: '#555' }}>
                    <strong>報酬:</strong> {message.jobData.salary}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '8px'
                }}>
                  <button
                    onClick={() => handleJobResponse(message.jobData!.id, 'apply')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#00b900',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    応募する
                  </button>
                  <button
                    onClick={() => handleJobResponse(message.jobData!.id, 'decline')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#f5f5f5',
                      color: '#666',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    辞退
                  </button>
                </div>
              </div>
            )}

            {message.type === 'application_response' && message.responseData && (
              <div style={{
                textAlign: 'right',
                marginBottom: '8px'
              }}>
                <div style={{
                  display: 'inline-block',
                  backgroundColor: message.responseData.response === 'apply' ? '#00b900' : '#666',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  maxWidth: '200px'
                }}>
                  {message.responseData.response === 'apply' ? '応募しました！' : '辞退しました。'}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#999',
                  marginTop: '4px'
                }}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            )}

            {message.type === 'user_message' && message.messageData && (
              <div style={{
                textAlign: 'right',
                marginBottom: '8px'
              }}>
                <div style={{
                  display: 'inline-block',
                  backgroundColor: '#00b900',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  maxWidth: '250px',
                  textAlign: 'left'
                }}>
                  {message.messageData.content}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#999',
                  marginTop: '4px'
                }}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            )}

            {message.type === 'contractor_message' && message.messageData && (
              <div style={{
                textAlign: 'left',
                marginBottom: '8px'
              }}>
                <div style={{
                  display: 'inline-block',
                  backgroundColor: 'white',
                  color: '#333',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  maxWidth: '250px',
                  border: '1px solid #ddd'
                }}>
                  {message.messageData.content}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#999',
                  marginTop: '4px'
                }}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Message Input - Only show when there's an active thread */}
      {activeThreadId && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          borderTop: '1px solid #ddd',
          padding: '12px 16px'
        }}>
          <form onSubmit={handleSendMessage} style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            <input
              type="text"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder="メッセージを入力..."
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '20px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!userMessage.trim()}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: userMessage.trim() ? '#00b900' : '#ddd',
                color: 'white',
                border: 'none',
                cursor: userMessage.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
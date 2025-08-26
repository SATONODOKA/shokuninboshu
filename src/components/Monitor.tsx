import { useState, useEffect } from 'react';
import { BellIcon, ChatBubbleLeftRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import { bus, BusEvent } from '../lib/bus';
import { NotificationFeed } from './NotificationFeed';
import { DmList } from './DmList';
import { DmThreadView } from './DmThreadView';

interface LineMessage {
  id: string;
  type: 'job_notification' | 'application_response';
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
}

export const Monitor = () => {
  const [messages, setMessages] = useState<LineMessage[]>([]);
  const [applicantName, setApplicantName] = useState('田中太郎');

  useEffect(() => {
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

    bus.on('JOB_PUBLISHED', handleJobNotification);
    return () => bus.off('JOB_PUBLISHED', handleJobNotification);
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

    // Send response back to dashboard
    bus.emit('APPLICATION_ADDED', {
      applicationId: 'app-' + Date.now(),
      jobId,
      jobTitle: messages.find(m => m.jobData?.id === jobId)?.jobData?.title || 'Unknown Job',
      applicantName,
      status: response === 'apply' ? 'APPLIED' : 'DECLINED'
    });

    setTimeout(() => {
      alert(response === 'apply' ? '応募を送信しました！' : '応募を辞退しました。');
    }, 500);
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
        backgroundColor: '#f5f5f5'
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
          </div>
        ))}
      </div>
    </div>
  );
};
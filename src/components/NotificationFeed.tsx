import { useState, useEffect } from 'react';
import { 
  BriefcaseIcon, 
  UserPlusIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { bus, BusEvent } from '../lib/bus';

interface Notification {
  id: string;
  type: 'JOB_PUBLISHED' | 'APPLICATION_ADDED' | 'APP_STATUS_CHANGED';
  timestamp: number;
  data: any;
  read: boolean;
}

export const NotificationFeed = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);


  useEffect(() => {
    const savedNotifications = localStorage.getItem('monitor_notifications');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (error) {
        console.warn('Failed to load notifications:', error);
      }
    }

    const handleEvent = (event: BusEvent) => {
      if (['JOB_PUBLISHED', 'APPLICATION_ADDED', 'APP_STATUS_CHANGED'].includes(event.type)) {
        const notification: Notification = {
          id: `${event.type}_${event.timestamp}_${Math.random().toString(36).substr(2, 9)}`,
          type: event.type as any,
          timestamp: event.timestamp,
          data: event.data,
          read: false
        };

        setNotifications(prev => {
          const updated = [notification, ...prev].slice(0, 100);
          localStorage.setItem('monitor_notifications', JSON.stringify(updated));
          return updated;
        });
      }
    };

    bus.on('JOB_PUBLISHED', handleEvent);
    bus.on('APPLICATION_ADDED', handleEvent);
    bus.on('APP_STATUS_CHANGED', handleEvent);

    return () => {
      bus.off('JOB_PUBLISHED', handleEvent);
      bus.off('APPLICATION_ADDED', handleEvent);
      bus.off('APP_STATUS_CHANGED', handleEvent);
    };
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem('monitor_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'JOB_PUBLISHED':
        return <BriefcaseIcon className="h-5 w-5 text-blue-500" />;
      case 'APPLICATION_ADDED':
        return <UserPlusIcon className="h-5 w-5 text-green-500" />;
      case 'APP_STATUS_CHANGED':
        return <CheckCircleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ExclamationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationMessage = (notification: Notification) => {
    switch (notification.type) {
      case 'JOB_PUBLISHED':
        return `新しい求人「${notification.data.title}」が公開されました`;
      case 'APPLICATION_ADDED':
        return `「${notification.data.jobTitle}」に新しい応募がありました`;
      case 'APP_STATUS_CHANGED':
        return `応募の状態が「${notification.data.status}」に変更されました`;
      default:
        return '通知';
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'たった今';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}時間前`;
    
    return new Date(timestamp).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">通知はありません</p>
        <p className="text-xs text-gray-400 mt-2">求人を作成するか、応募テストを実行すると通知が表示されます</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          onClick={() => markAsRead(notification.id)}
          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
            notification.read
              ? 'bg-white border-gray-200'
              : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
          }`}
        >
          <div className="flex items-start gap-3">
            {getNotificationIcon(notification.type)}
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${notification.read ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                {getNotificationMessage(notification)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <ClockIcon className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {formatTime(notification.timestamp)}
                </span>
              </div>
            </div>
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
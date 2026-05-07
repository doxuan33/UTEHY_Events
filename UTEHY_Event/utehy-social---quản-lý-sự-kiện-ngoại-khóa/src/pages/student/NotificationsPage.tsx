import { useEffect, useState } from 'react';
import { useNotificationsStore, Notification } from '@/store/notifications.store';
import { 
  Bell, 
  CheckCircle2, 
  Calendar, 
  AlertCircle, 
  Info, 
  Trash2, 
  CheckSquare,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Button } from '@/components/common/Button';

export const NotificationsPage = () => {
  const { 
    notifications, 
    isLoading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    unreadCount 
  } = useNotificationsStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'EVENT_APPROVED': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'EVENT_NEW': return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'CHECKIN_SUCCESS': return <CheckCircle2 className="h-5 w-5 text-indigo-500" />;
      case 'EVENT_REMINDER': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'SYSTEM': return <Info className="h-5 w-5 text-gray-500" />;
      default: return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getLink = (notification: Notification) => {
    const data = notification.data;
    if (data?.event_id) return `/events/${data.event_id}`;
    if (data?.page_id) return `/clubs/${data.page_id}`;
    return '#';
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-1 tracking-tight">Thông báo</h1>
          <p className="text-gray-500 font-medium">Bạn có {unreadCount} thông báo chưa đọc</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-blue-600 hover:bg-blue-50 rounded-xl"
            onClick={() => markAllAsRead()}
            disabled={unreadCount === 0}
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            Đánh dấu đã đọc tất cả
          </Button>
        </div>
      </div>

      {isLoading && notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Đang tải thông báo...</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group relative bg-white rounded-3xl p-5 border transition-all hover:shadow-md ${notification.is_read ? 'border-gray-100 opacity-80' : 'border-blue-100 bg-blue-50/30 shadow-sm'}`}
              >
                <Link 
                  to={getLink(notification)}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                  className="flex items-start space-x-4"
                >
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${notification.is_read ? 'bg-gray-100' : 'bg-blue-100 shadow-inner'}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`text-sm font-bold truncate ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap ml-4">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: vi })}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${notification.is_read ? 'text-gray-500' : 'text-gray-700'}`}>
                      {notification.body}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors self-center" />
                </Link>
                {!notification.is_read && (
                  <div className="absolute top-5 right-5 h-2 w-2 bg-blue-600 rounded-full" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {notifications.length === 0 && (
            <div className="bg-white rounded-3xl p-20 text-center border border-gray-100">
              <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="h-10 w-10 text-gray-200" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Hộp thư trống</h3>
              <p className="text-gray-500 font-medium">Bạn chưa có thông báo nào vào lúc này</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Clock = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

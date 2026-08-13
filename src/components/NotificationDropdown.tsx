'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Trash2, Check, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { getNotificationsAction, markNotificationReadAction, markAllNotificationsReadAction, deleteNotificationAction } from '@/lib/actions/notification';

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  type: string;
  isRead: boolean;
  createdAt: Date | string;
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    const res = await getNotificationsAction();
    if (res.success && res.notifications) {
      setNotifications(res.notifications as any);
      setUnreadCount(res.unreadCount || 0);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll for notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await markNotificationReadAction(id);
    if (res.success) {
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    const res = await markAllNotificationsReadAction();
    if (res.success) {
      fetchNotifications();
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await deleteNotificationAction(id);
    if (res.success) {
      fetchNotifications();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          fetchNotifications();
        }}
        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors border border-border relative cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-[9px] font-black text-white rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 text-xs">
          <div className="p-3 bg-muted/20 border-b border-border/60 flex justify-between items-center">
            <h3 className="font-black text-foreground uppercase tracking-wider text-[10px]">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[9px] font-black text-primary hover:underline uppercase tracking-wider cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-border/40">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground italic">
                No alerts at this time
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 space-y-1.5 transition-colors flex gap-2.5 items-start ${
                    notif.isRead ? 'bg-transparent' : 'bg-primary/5 hover:bg-primary/10'
                  }`}
                >
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <span className="font-bold text-foreground truncate block leading-snug">
                        {notif.title}
                      </span>
                      <span className="text-[8px] text-muted-foreground font-semibold shrink-0">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-muted-foreground font-semibold leading-relaxed text-[11px]">
                      {notif.description}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 items-center shrink-0">
                    {!notif.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(notif.id, e)}
                        className="p-1 hover:bg-muted rounded text-primary cursor-pointer"
                        title="Mark as Read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(notif.id, e)}
                      className="p-1 hover:bg-rose-500/10 rounded text-muted-foreground hover:text-rose-500 cursor-pointer"
                      title="Delete Notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

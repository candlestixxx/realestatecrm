'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import TeamChat from "@/components/TeamChat";
import toast from 'react-hot-toast';

interface Message {
  id: string;
  channel: string;
  direction: string;
  fromName: string | null;
  fromAddress: string | null;
  subject: string | null;
  body: string;
  isRead: boolean;
  createdAt: string;
  lead?: { id: string; contact: { firstName: string; lastName: string | null } } | null;
}

const CHANNELS = [
  { id: 'all', name: 'All', icon: '📥' },
  { id: 'email', name: 'Email', icon: '✉️' },
  { id: 'sms', name: 'SMS', icon: '📱' },
  { id: 'facebook', name: 'Facebook', icon: '📘' },
  { id: 'instagram', name: 'Instagram', icon: '📸' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
  { id: 'twitter', name: 'Twitter', icon: '🐦' },
];

export default function UnifiedInboxPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id || 'current-user';
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeChannel, setActiveChannel] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadMessages = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (activeChannel !== 'all') params.set('channel', activeChannel);
      const res = await fetch(`/api/inbox?${params}`);
      const data = await res.json();
      setMessages(data.messages || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [activeChannel]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  const markAsRead = async (messageIds: string[]) => {
    try {
      await fetch('/api/inbox', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds }),
      });
      setMessages(prev => prev.map(m => messageIds.includes(m.id) ? { ...m, isRead: true } : m));
      setUnreadCount(prev => Math.max(0, prev - messageIds.length));
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/inbox', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
      setUnreadCount(0);
      toast.success('All messages marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const getChannelIcon = (channel: string) =>
    CHANNELS.find(c => c.id === channel)?.icon || '💬';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Unified Inbox <span title="All customer communications in one place: email, SMS, voice calls, and team chat. Assign conversations and set response reminders." aria-label="About this section: All customer communications in one place: email, SMS, voice calls, and team chat. Assign conversations and set response reminders." className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[9px] text-gray-500 cursor-help ml-2 align-middle">?</span></h1>
          <p className="text-sm text-muted-foreground mt-1">
            All conversations from email, SMS, and social media in one place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="px-3 py-1.5 bg-red-500/15 text-red-500 text-xs font-bold rounded-full">
              {unreadCount} unread
            </span>
          )}
          <button
            onClick={markAllRead}
            className="px-4 py-2 text-sm text-secondary border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Mark All Read
          </button>
        </div>
      </div>

      {/* Channel Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {CHANNELS.map(channel => (
          <button
            key={channel.id}
            onClick={() => setActiveChannel(channel.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
              activeChannel === channel.id
                ? 'bg-secondary text-secondary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>{channel.icon}</span>
            {channel.name}
          </button>
        ))}
      </div>

      {/* Message List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading messages...</div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 border border-border rounded-xl">
          <div className="text-3xl mb-2">📭</div>
          <p className="text-sm text-muted-foreground">
            {activeChannel === 'all' ? 'No messages yet.' : `No ${activeChannel} messages.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map(msg => (
            <div
              key={msg.id}
              onClick={() => !msg.isRead && markAsRead([msg.id])}
              className={`p-4 border rounded-xl cursor-pointer transition-colors ${
                msg.isRead
                  ? 'bg-background border-border'
                  : 'bg-secondary/5 border-secondary/20 hover:bg-secondary/10'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-xl mt-0.5">{getChannelIcon(msg.channel)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!msg.isRead && <span className="w-2 h-2 rounded-full bg-secondary flex-shrink-0" />}
                      <span className="text-sm font-bold text-foreground truncate">
                        {msg.fromName || msg.fromAddress || 'Unknown'}
                      </span>
                      {msg.lead && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-muted rounded-full text-muted-foreground">
                          {msg.lead.contact.firstName} {msg.lead.contact.lastName}
                        </span>
                      )}
                    </div>
                    {msg.subject && (
                      <p className="text-sm font-medium text-foreground truncate mt-0.5">{msg.subject}</p>
                    )}
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.body}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="mt-1">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                      msg.direction === 'inbound' ? 'bg-green-500/15 text-green-500' : 'bg-blue-500/15 text-blue-500'
                    }`}>
                      {msg.direction}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Internal team chat */}
      <TeamChat currentUserId={currentUserId} />
    </div>
  );
}

'use client';

// TeamChat — internal private/group chat panel.
// Why: agents need direct messaging and group channels without leaving the
// CRM. Separate from Message model (external comms). Uses REST polling
// (3s interval) for simplicity; can upgrade to WebSocket later.

import { useState, useEffect, useRef, useCallback } from 'react';

interface ChatUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface ChatParticipant {
  id: string;
  userId: string;
  user: ChatUser;
}

interface ChatMessage {
  id: string;
  body: string;
  createdAt: string;
  sender: ChatUser;
}

interface ChatRoom {
  id: string;
  name: string | null;
  type: string;
  participants: ChatParticipant[];
  messages: ChatMessage[];
}

export default function TeamChat({ currentUserId }: { currentUserId: string }) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [newChatType, setNewChatType] = useState<'DIRECT' | 'GROUP'>('DIRECT');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/rooms');
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch {
      // silent — retried every 10s
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (roomId: string) => {
    try {
      const res = await fetch('/api/chat/messages?roomId=' + roomId);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 10_000);
    return () => clearInterval(interval);
  }, [loadRooms]);

  useEffect(() => {
    if (activeRoom) {
      loadMessages(activeRoom.id);
      const interval = setInterval(() => loadMessages(activeRoom.id), 3000);
      return () => clearInterval(interval);
    }
  }, [activeRoom, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeRoom) return;
    const text = newMessage;
    setNewMessage('');
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: activeRoom.id, text }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch {
      // revert on failure
      setNewMessage(text);
    }
  };

  const getRoomLabel = (room: ChatRoom) => {
    if (room.type === 'GROUP') return room.name || 'Group Chat';
    const other = room.participants.find((p) => p.userId !== currentUserId);
    return other?.user?.name || other?.user?.email || 'Direct Message';
  };

  return (
    <div className="bg-background border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-bold text-foreground">💬 Team Chat</h2>
        <button
          onClick={() => setShowNewChat(!showNewChat)}
          className="text-xs text-secondary hover:underline font-medium"
        >
          + New Chat
        </button>
      </div>

      {/* New chat form */}
      {showNewChat && (
        <div className="px-4 py-3 border-b border-border bg-muted/30 space-y-2">
          <select
            value={newChatType}
            onChange={(e) => setNewChatType(e.target.value as 'DIRECT' | 'GROUP')}
            className="w-full px-3 py-1.5 text-xs border border-border rounded-lg bg-background"
          >
            <option value="DIRECT">Direct Message</option>
            <option value="GROUP">Group Chat</option>
          </select>
          {newChatType === 'GROUP' && (
            <input
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              placeholder="Group name"
              className="w-full px-3 py-1.5 text-xs border border-border rounded-lg bg-background"
            />
          )}
          <button
            onClick={async () => {
              try {
                const res = await fetch('/api/chat/rooms', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: newChatType,
                    name: newChatName || undefined,
                    participantIds: [],
                  }),
                });
                const data = await res.json();
                if (data.room) {
                  setRooms((prev) => [data.room, ...prev]);
                  setActiveRoom(data.room);
                  setShowNewChat(false);
                  setNewChatName('');
                }
              } catch { /* network error */ }
            }}
            className="w-full px-3 py-1.5 bg-secondary text-secondary-foreground text-xs font-bold rounded-lg hover:bg-secondary/90"
          >
            Create
          </button>
        </div>
      )}

      <div className="flex h-[400px]">
        {/* Room list sidebar */}
        <div className="w-1/3 border-r border-border overflow-y-auto">
          {loading ? (
            <div className="p-4 text-xs text-muted-foreground">Loading...</div>
          ) : rooms.length === 0 ? (
            <div className="p-4 text-xs text-muted-foreground">
              No chats yet. Start one!
            </div>
          ) : (
            rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setActiveRoom(room)}
                className={
                  'w-full text-left px-3 py-2.5 border-b border-border/50 hover:bg-muted/50 transition-colors ' +
                  (activeRoom?.id === room.id ? 'bg-muted' : '')
                }
              >
                <div className="text-xs font-semibold text-foreground truncate">
                  {room.type === 'GROUP' ? '👥 ' : '👤 '}
                  {getRoomLabel(room)}
                </div>
                {room.messages[0] && (
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {room.messages[0].body}
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Message area */}
        <div className="flex-1 flex flex-col">
          {!activeRoom ? (
            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
              Select a chat to start messaging
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.map((msg) => {
                  const isOwn = msg.sender.id === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={'flex ' + (isOwn ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={
                          'max-w-[75%] rounded-lg px-3 py-2 text-xs ' +
                          (isOwn
                            ? 'bg-secondary text-secondary-foreground'
                            : 'bg-muted text-foreground')
                        }
                      >
                        {!isOwn && (
                          <div className="text-xs font-semibold text-muted-foreground mb-0.5">
                            {msg.sender.name || 'Unknown'}
                          </div>
                        )}
                        <div>{msg.body}</div>
                        <div className="text-xs text-muted-foreground/70 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="border-t border-border p-2 flex gap-2">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 text-xs border border-border rounded-lg bg-background"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-secondary text-secondary-foreground text-xs font-bold rounded-lg hover:bg-secondary/90 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

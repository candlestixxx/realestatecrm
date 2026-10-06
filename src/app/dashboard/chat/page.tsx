'use client';
// Team chat — real-time messaging for the workspace.
// Uses /api/chat/rooms and /api/chat/messages for room/message CRUD.

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Plus, Users, Loader2 } from 'lucide-react';

interface Room { id: string; name: string; }
interface Message { id: string; body: string; sender: string; sentAt: string; }

export default function ChatPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/chat/rooms').then(r => r.json()).then(d => {
      const list = Array.isArray(d) ? d : d.rooms || [];
      setRooms(list);
      if (list.length > 0) setActiveRoom(list[0].id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeRoom) return;
    fetch(`/api/chat/messages?roomId=${activeRoom}`).then(r => r.json()).then(d => {
      setMessages(Array.isArray(d) ? d : d.messages || []);
    }).catch(() => {});
  }, [activeRoom]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function handleSend() {
    if (!input.trim() || !activeRoom) return;
    const msg = { body: input, roomId: activeRoom };
    setInput('');
    // Optimistic add
    setMessages(prev => [...prev, { id: 'temp', body: input, sender: 'You', sentAt: new Date().toISOString() }]);
    await fetch('/api/chat/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(msg) });
  }

  return (
    <div className="p-6 max-w-5xl h-[calc(100vh-4rem)]">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <MessageSquare className="w-6 h-6 text-primary" /> Team Chat
      </h1>
      <div className="flex gap-4 h-[calc(100%-4rem)]">
        <div className="w-56 border rounded-lg p-3 shrink-0 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-muted-foreground">Rooms</span>
            <button className="p-1 hover:bg-muted rounded" title="New room"><Plus className="w-4 h-4" /></button>
          </div>
          {rooms.map(r => (
            <button key={r.id} onClick={() => setActiveRoom(r.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm mb-1 transition-colors ${activeRoom === r.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}>
              <Users className="w-3.5 h-3.5 inline mr-1.5" />{r.name}
            </button>
          ))}
          {rooms.length === 0 && !loading && <p className="text-xs text-muted-foreground">No rooms yet.</p>}
        </div>
        <div className="flex-1 border rounded-lg flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading && <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>}
            {messages.map(m => (
              <div key={m.id} className="max-w-[70%]">
                <div className="text-xs text-muted-foreground mb-0.5">{m.sender} · {new Date(m.sentAt).toLocaleTimeString()}</div>
                <div className="rounded-lg bg-muted px-3 py-2 text-sm">{m.body}</div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="border-t p-3 flex gap-2">
            <input placeholder="Type a message..." value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              className="flex-1 rounded-md border px-3 py-2 text-sm" />
            <button onClick={handleSend} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

interface ConsoleMessage {
  role: 'user' | 'agent';
  text: string;
  intent?: string;
  usedLLM?: boolean;
  timestamp: Date;
}

const EXAMPLE_COMMANDS = [
  'Create a lead for John Doe, email john@example.com, phone 555-0100',
  'Find contacts named Smith',
  'What is the status of lead #1?',
  'Create a task: call back the hot lead tomorrow',
  'Show me all hot leads',
  'Log activity: discussed pricing with client',
];

export default function AgentCoreConsole() {
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useLLM, setUseLLM] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendCommand = async (command: string) => {
    if (!command.trim() || isLoading) return;

    const userMsg: ConsoleMessage = { role: 'user', text: command, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/agentcore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, useLLM }),
      });
      const data = await res.json();

      const agentMsg: ConsoleMessage = {
        role: 'agent',
        text: data.message || data.error || 'No response',
        intent: data.intent,
        usedLLM: data.usedLLM,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentMsg]);
    } catch {
      toast.error('Failed to send command');
      setMessages(prev => [...prev, { role: 'agent', text: 'Error: failed to reach AgentCore engine.', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendCommand(input);
  };

  return (
    <div className="flex flex-col h-[600px] bg-background border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h2 className="text-sm font-bold text-foreground">AgentCore Console</h2>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">NL Command Engine</span>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={useLLM}
            onChange={e => setUseLLM(e.target.checked)}
            className="rounded border-border"
          />
          LLM Fallback
        </label>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🤖</div>
            <p className="text-sm text-muted-foreground mb-4">Type a natural-language command to control your CRM.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLE_COMMANDS.map(cmd => (
                <button
                  key={cmd}
                  onClick={() => sendCommand(cmd)}
                  className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-full border border-border transition-colors"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.length === 0 ? <div className="text-center py-8 text-muted-foreground text-sm">No messages yet. Try a command above.</div> : messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
              msg.role === 'user'
                ? 'bg-secondary text-secondary-foreground'
                : 'bg-muted text-foreground border border-border'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              {msg.role === 'agent' && (msg.intent || msg.usedLLM) && (
                <div className="flex gap-2 mt-1.5">
                  {msg.intent && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary/15 text-secondary font-bold uppercase">
                      {msg.intent}
                    </span>
                  )}
                  {msg.usedLLM && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-500 font-bold uppercase">
                      LLM
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted border border-border rounded-xl px-4 py-2.5">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-muted/20">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="e.g. Create a lead for Jane Smith, email jane@example.com"
            className="flex-1 px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/50 text-foreground placeholder:text-muted-foreground"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-5 py-2.5 bg-secondary text-secondary-foreground text-sm font-bold rounded-lg hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}

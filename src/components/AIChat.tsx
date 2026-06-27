'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Mic, MicOff } from 'lucide-react';

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I am Gemini, your real estate AI assistant. How can I help you dominate your market today?',
      },
    ],
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-transform hover:scale-105 z-50"
          aria-label="Open AI Assistant"
        >
          <div className="text-xl">🤖</div>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-full max-w-sm sm:w-[450px] h-[600px] bg-background border border-border shadow-2xl rounded-2xl flex flex-col z-50 overflow-hidden">
          <div className="bg-primary p-4 flex justify-between items-center text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
              <h3 className="font-bold text-sm tracking-tight uppercase">Gemini AI Command Center</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-sm shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-br-none' 
                      : 'bg-white dark:bg-muted/30 border border-border rounded-bl-none'
                  }`}
                >
                  {m.content}

                  {m.toolInvocations?.map((toolInvocation: any) => {
                    const toolCallId = toolInvocation.toolCallId;

                    if ('state' in toolInvocation && toolInvocation.state === 'result') {
                      return (
                        <div key={toolCallId} className="mt-3 text-[10px] bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2 flex items-center gap-2">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">COMMAND COMPLETE:</span>
                          <span className="text-emerald-600 dark:text-emerald-500 uppercase tracking-tighter">{toolInvocation.toolName}</span>
                        </div>
                      );
                    } else {
                      return (
                        <div key={toolCallId} className="mt-3 text-[10px] bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2 flex items-center gap-2 animate-pulse">
                          <span className="font-bold text-amber-700 dark:text-amber-400">EXECUTING:</span>
                          <span className="text-amber-600 dark:text-amber-500 uppercase tracking-tighter">{toolInvocation.toolName}...</span>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-start">
                <div className="bg-muted/50 border border-border rounded-lg rounded-bl-none p-3 text-sm flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div
                    className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-border bg-background">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Ask me anything..."
                className="flex-1 bg-muted/30 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setIsVoiceMode(!isVoiceMode)}
                className={`p-2 rounded-md transition-colors ${isVoiceMode ? 'bg-red-500/20 text-red-500' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
              >
                {isVoiceMode ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

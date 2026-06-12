'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

type Message = {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
};

export default function SidebarAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'assistant',
      text: 'Hi! I am your Gemini CRM Assistant. How can I help you manage your leads, write follow-up drafts, or automate agent tasks today?',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      sender: 'user',
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response based on real estate queries
    setTimeout(() => {
      let reply = 'I can help you audit lead records or prepare offer packages. Try clicking one of the quick actions below!';
      const txt = textToSend.toLowerCase();

      if (txt.includes('sms') || txt.includes('text') || txt.includes('follow up')) {
        reply = 'Here is a recommended follow-up SMS draft:\n\n"Hi {{firstName}}, I saw some new matches that just hit the MLS in your price band! Let me know if you are free for a quick call or viewing tour this week."';
      } else if (txt.includes('email') || txt.includes('template')) {
        reply = 'Here is an email introduction draft:\n\nSubject: Exploring home matches in {{city}}\n\n"Hi {{firstName}},\n\nI set up an automated MLS alert for you. You will get instant notifications for new listings matching your criteria. Let me know if you would like to adjust your filters!"';
      } else if (txt.includes('note') || txt.includes('timeline')) {
        reply = 'Note drafted: "AI Agent analyzed timeline: Lead exhibits high interest in preforeclosure matches. Initiated MLS alert Setup."';
      } else if (txt.includes('workflow') || txt.includes('agent')) {
        reply = 'You can automate this in the AI Agent Studio! Set the trigger to "STATUS_CHANGE" and configure the SMS outreach node.';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          sender: 'assistant',
          text: reply,
        },
      ]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div className="flex h-full border-l border-border relative z-30">
      {/* Trigger Rail (Collapsable Strip) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 bg-muted/50 hover:bg-muted border-r border-border h-full flex flex-col items-center py-6 gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <span className="text-lg">✨</span>
        <span className="text-[10px] font-bold uppercase tracking-widest [writing-mode:vertical-rl] select-none">
          AI Assistant
        </span>
      </button>

      {/* Expanded Chat Drawer */}
      {isOpen && (
        <div className="w-80 bg-background h-full flex flex-col animate-in slide-in-from-right duration-250">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <div>
                <h4 className="font-bold text-sm">Gemini CRM Assistant</h4>
                <p className="text-[10px] text-green-500 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  Active Copilot
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Close
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col max-w-[85%] ${
                  m.sender === 'user' ? 'ml-auto items-end' : 'items-start'
                }`}
              >
                <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight mb-1">
                  {m.sender === 'user' ? 'Agent' : 'Gemini AI'}
                </span>
                <div
                  className={`p-3 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed border ${
                    m.sender === 'user'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/30 border-border text-foreground'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-1 items-center pl-2">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="p-3 bg-muted/10 border-t border-border/50 flex flex-wrap gap-1">
            <button
              onClick={() => handleSend('Draft follow up SMS')}
              className="px-2 py-1 bg-background hover:bg-muted border border-border text-[9px] font-bold uppercase rounded-lg text-muted-foreground hover:text-foreground"
            >
              💬 Draft SMS
            </button>
            <button
              onClick={() => handleSend('Draft follow up email')}
              className="px-2 py-1 bg-background hover:bg-muted border border-border text-[9px] font-bold uppercase rounded-lg text-muted-foreground hover:text-foreground"
            >
              ✉️ Draft Email
            </button>
            <button
              onClick={() => handleSend('Summarize lead notes')}
              className="px-2 py-1 bg-background hover:bg-muted border border-border text-[9px] font-bold uppercase rounded-lg text-muted-foreground hover:text-foreground"
            >
              📝 Summarize
            </button>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="p-4 border-t border-border flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-muted/30 border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-primary text-primary-foreground font-bold rounded-lg text-xs hover:bg-primary/90 transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

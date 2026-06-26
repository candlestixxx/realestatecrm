'use client';

import { useState, useEffect } from 'react';
import SmsForm from './SmsForm';
import EmailForm from './EmailForm';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CommunicationsHub({
  leadId,
  phone,
  email,
}: {
  leadId?: string;
  phone?: string | null;
  email?: string | null;
}) {
  const [mode, setMode] = useState<'sms' | 'email' | 'video'>('sms');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('crm_communications_hub_collapsed');
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('crm_communications_hub_collapsed', JSON.stringify(nextState));
  };

  if (!isMounted) {
    return <div className="w-12 border-l border-border h-full bg-muted/10 shrink-0"></div>;
  }

  if (isCollapsed) {
    return (
      <div className="w-12 border-l border-border h-full bg-card flex flex-col items-center py-4 justify-between transition-all duration-300 select-none shadow-sm shrink-0">
        <div className="flex flex-col items-center gap-6 w-full">
          <button
            onClick={toggleCollapse}
            className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title="Expand Communications Hub"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="h-[1px] w-8 bg-border" />

          <button
            onClick={() => {
              setMode('sms');
              toggleCollapse();
            }}
            className={`p-2.5 rounded-xl transition-all hover:scale-105 ${mode === 'sms' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            title="Send SMS"
          >
            <span className="text-lg block">📱</span>
          </button>

          <button
            onClick={() => {
              setMode('email');
              toggleCollapse();
            }}
            className={`p-2.5 rounded-xl transition-all hover:scale-105 ${mode === 'email' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            title="Send Email"
          >
            <span className="text-lg block">✉️</span>
          </button>

          <button
            onClick={() => {
              setMode('video');
              toggleCollapse();
            }}
            className={`p-2.5 rounded-xl transition-all hover:scale-105 ${mode === 'video' ? 'bg-secondary/10 text-secondary' : 'text-muted-foreground hover:text-foreground'}`}
            title="Video Meeting"
          >
            <span className="text-lg block">🎥</span>
          </button>
        </div>

        <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest [writing-mode:vertical-rl] select-none opacity-40">
          Comm Hub
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 border-l border-border h-full bg-card flex flex-col transition-all duration-300 shadow-sm shrink-0 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/10 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <div>
            <h4 className="font-extrabold text-sm text-foreground">Communications Hub</h4>
            <p className="text-[10px] text-muted-foreground">Manage client interactions</p>
          </div>
        </div>
        <button
          onClick={toggleCollapse}
          className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          title="Collapse Panel"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Mode Selectors */}
        <div className="grid grid-cols-3 gap-2">
          <button 
            onClick={() => setMode('sms')}
            className={`flex flex-col items-center justify-center py-3 px-2 border rounded-xl transition-all ${mode === 'sms' ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary' : 'border-border hover:bg-muted/10'}`}
          >
            <span className="text-xl mb-1">📱</span>
            <span className="font-extrabold text-[10px] uppercase tracking-wider">SMS</span>
          </button>
          <button
            onClick={() => setMode('email')}
            className={`flex flex-col items-center justify-center py-3 px-2 border rounded-xl transition-all ${mode === 'email' ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary' : 'border-border hover:bg-muted/10'}`}
          >
            <span className="text-xl mb-1">✉️</span>
            <span className="font-extrabold text-[10px] uppercase tracking-wider">Email</span>
          </button>
          <button
            onClick={() => setMode('video')}
            className={`flex flex-col items-center justify-center py-3 px-2 border rounded-xl transition-all ${mode === 'video' ? 'border-secondary bg-secondary/5 text-secondary ring-1 ring-secondary' : 'border-border hover:bg-muted/10'}`}
          >
            <span className="text-xl mb-1">🎥</span>
            <span className="font-extrabold text-[10px] uppercase tracking-wider">Video</span>
          </button>
        </div>

        {/* Dynamic Mode Form */}
        <div className="space-y-4">
          {mode === 'sms' && <SmsForm leadId={leadId} phone={phone} />}
          {mode === 'email' && <EmailForm leadId={leadId} email={email} />}
          {mode === 'video' && (
            <div className="border border-border border-dashed rounded-xl p-6 text-center bg-muted/5 animate-in fade-in duration-200">
              <span className="text-3xl mb-2 block">🎥</span>
              <h3 className="font-bold text-xs mb-1 text-secondary">Initiate Live Video Call</h3>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto mb-4">
                Launch a secure WebRTC meeting to walk through listing folders or documents.
              </p>
              <button
                type="button"
                onClick={() => {
                  console.log("[Video API] Launching simulated WebRTC session...");
                  window.open("https://meet.google.com", "_blank");
                }}
                className="px-4 py-2 bg-secondary text-secondary-foreground text-xs font-bold rounded-lg hover:bg-secondary/90 transition-all shadow-md cursor-pointer"
              >
                 Generate Meeting Link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

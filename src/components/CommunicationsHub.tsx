'use client';

import { useState } from 'react';
import SmsForm from './SmsForm';
import EmailForm from './EmailForm';

export default function CommunicationsHub({
  leadId,
  phone,
  email,
}: {
  leadId?: string;
  phone?: string | null;
  email?: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'sms' | 'email' | 'video'>('sms');

  return (
    <div className="flex h-full border-l border-border relative z-30 shrink-0">
      {/* Trigger Rail (Collapsable Strip) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 bg-muted/50 hover:bg-muted border-r border-border h-full flex flex-col items-center py-6 gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
      >
        <span className="text-lg">📱</span>
        <span className="text-[10px] font-bold uppercase tracking-widest [writing-mode:vertical-rl] select-none">
          Communications
        </span>
      </button>

      {/* Expanded Chat Drawer */}
      {isOpen && (
        <div className="w-[380px] bg-background h-full flex flex-col animate-in slide-in-from-right duration-250 p-6 overflow-y-auto border-l border-border">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-border/60">
            <div>
              <h2 className="text-sm font-black text-foreground uppercase tracking-wider">Communications Hub</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">Send SMS, Emails, and Video Calls</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground font-extrabold cursor-pointer"
            >
              Hide ➔
            </button>
          </div>

          {!leadId ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center py-12">
              <span className="text-4xl mb-3">📱</span>
              <h2 className="text-xs font-black text-foreground uppercase tracking-wider">No Active Lead</h2>
              <p className="text-[11px] text-muted-foreground max-w-xs mt-2 leading-relaxed">
                Select a lead or open a lead detail page to send SMS, draft emails, or schedule video calls.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-xs text-muted-foreground leading-relaxed">Send SMS, Emails, and initiate Video Chats directly from the CRM.</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setMode('sms')}
                  className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-colors cursor-pointer ${mode === 'sms' ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted/10'}`}
                >
                  <span className="text-2xl mb-1.5">📱</span>
                  <span className="font-bold text-[10px] text-foreground">Send SMS</span>
                </button>
                <button
                  onClick={() => setMode('email')}
                  className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-colors cursor-pointer ${mode === 'email' ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted/10'}`}
                >
                  <span className="text-2xl mb-1.5">✉️</span>
                  <span className="font-bold text-[10px] text-foreground">Send Email</span>
                </button>
                <button
                  onClick={() => setMode('video')}
                  className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-colors cursor-pointer ${mode === 'video' ? 'border-secondary bg-secondary/5 text-secondary' : 'border-border hover:bg-muted/10'}`}
                >
                  <span className="text-2xl mb-1.5">🎥</span>
                  <span className="font-bold text-[10px] text-foreground">Video Meeting</span>
                </button>
              </div>

              <div className="space-y-4 pt-2 border-t border-border/40">
                {mode === 'sms' && <SmsForm leadId={leadId} phone={phone} />}
                {mode === 'email' && <EmailForm leadId={leadId} email={email} />}
                {mode === 'video' && (
                  <div className="border border-border border-dashed rounded-xl p-6 text-center bg-muted/5">
                    <span className="text-3xl mb-2 block">🎥</span>
                    <h3 className="font-bold text-xs mb-1 text-secondary">Initiate Live Video Call</h3>
                    <p className="text-[11px] text-muted-foreground max-w-sm mx-auto mb-4 leading-relaxed">Launch a secure WebRTC meeting to walk through offer documents or listing folders directly with the client.</p>
                    <button 
                      type="button"
                      onClick={() => {
                        console.log("[Video API] Launching simulated WebRTC session...");
                        window.open("https://meet.google.com", "_blank");
                      }}
                      className="px-4 py-2 bg-secondary text-secondary-foreground text-[10px] font-bold rounded-lg hover:bg-secondary/90 transition-all shadow-md cursor-pointer"
                    >
                       Generate Meeting Link
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

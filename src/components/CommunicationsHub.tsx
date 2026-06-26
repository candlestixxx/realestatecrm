'use client';

import { useState } from 'react';
import SmsForm from './SmsForm';
import EmailForm from './EmailForm';

export default function CommunicationsHub({
  leadId,
  phone,
  email,
}: {
  leadId: string;
  phone?: string | null;
  email?: string | null;
}) {
  const [mode, setMode] = useState<'sms' | 'email' | 'video'>('sms');

  return (
    <div className="bg-background border border-border rounded-xl shadow-sm p-6 min-h-[400px]">
      <h2 className="text-lg font-bold mb-4">Communications Hub</h2>
      <p className="text-sm text-muted-foreground mb-6">Send SMS, Emails, and initiate Video Chats directly from the CRM.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => setMode('sms')}
          className={`flex flex-col items-center justify-center p-6 border rounded-xl transition-colors ${mode === 'sms' ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted/10'}`}
        >
          <span className="text-3xl mb-2">📱</span>
          <span className="font-bold text-sm text-foreground">Send SMS</span>
        </button>
        <button
          onClick={() => setMode('email')}
          className={`flex flex-col items-center justify-center p-6 border rounded-xl transition-colors ${mode === 'email' ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted/10'}`}
        >
          <span className="text-3xl mb-2">✉️</span>
          <span className="font-bold text-sm text-foreground">Send Email</span>
        </button>
        <button
          onClick={() => setMode('video')}
          className={`flex flex-col items-center justify-center p-6 border rounded-xl transition-colors ${mode === 'video' ? 'border-secondary bg-secondary/5 text-secondary' : 'border-border hover:bg-muted/10'}`}
        >
          <span className="text-3xl mb-2">🎥</span>
          <span className="font-bold text-sm text-foreground">Video Meeting</span>
        </button>
      </div>

      {mode === 'sms' && <SmsForm leadId={leadId} phone={phone} />}
      {mode === 'email' && <EmailForm leadId={leadId} email={email} />}
      {mode === 'video' && (
        <div className="border border-border border-dashed rounded-xl p-8 text-center bg-muted/5">
          <span className="text-4xl mb-3 block">🎥</span>
          <h3 className="font-bold text-sm mb-1 text-secondary">Initiate Live Video Call</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">Launch a secure WebRTC meeting to walk through offer documents or listing folders directly with the client.</p>
          <button 
            type="button"
            onClick={() => {
              console.log("[Video API] Launching simulated WebRTC session...");
              window.open("https://meet.google.com", "_blank");
            }}
            className="px-4 py-2 bg-secondary text-secondary-foreground text-xs font-bold rounded-lg hover:bg-secondary/90 transition-all shadow-md"
          >
             Generate Meeting Link
          </button>
        </div>
      )}
    </div>
  );
}

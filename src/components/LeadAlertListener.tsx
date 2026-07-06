'use client';

import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { BellRing } from 'lucide-react';
import Link from 'next/link';

export default function LeadAlertListener() {
  const lastCheckedRef = useRef<string>(new Date().toISOString());

  // Web Audio API Synthesized Premium Notification Sound Chime
  const playNotificationChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const playNote = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.15, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + duration);
      };

      const now = ctx.currentTime;
      // High-end clear double-ping chime (E5 -> A5)
      playNote(659.25, now, 0.35);       // E5
      playNote(880.00, now + 0.12, 0.6);  // A5
    } catch (e) {
      console.warn('Audio chime failed:', e);
    }
  };

  const dismissLeadAlert = async (leadId: string, toastId: string) => {
    toast.dismiss(toastId);
    try {
      await fetch(`/api/leads/${leadId}/read`, { method: 'POST' });
    } catch (e) {
      console.warn('Failed to auto-dismiss read status:', e);
    }
  };

  useEffect(() => {
    const pollForNewLeads = async () => {
      try {
        const res = await fetch(`/api/leads/latest-unread?since=${encodeURIComponent(lastCheckedRef.current)}`);
        if (!res.ok) return;

        const data = await res.json();
        const newLeads = data.newLeads || [];

        if (newLeads.length > 0) {
          // Play premium chime sound
          playNotificationChime();

          // Trigger toast for each new lead
          newLeads.forEach((lead: any) => {
            toast.custom(
              (t) => (
                <div
                  className={`${
                    t.visible ? 'animate-enter' : 'animate-leave'
                  } max-w-md w-full bg-background border border-indigo-500/20 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden`}
                >
                  <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
                          <BellRing className="w-5 h-5 animate-bounce" />
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-xs font-black text-foreground uppercase tracking-wider">
                          🚨 New Inbound Lead
                        </p>
                        <p className="text-sm font-extrabold text-foreground mt-0.5">
                          {lead.contact?.firstName} {lead.contact?.lastName || ''}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 font-semibold">
                          📞 {lead.contact?.phone || 'No phone'} | Source: {lead.source}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex border-l border-border/80 flex-col divide-y divide-border/80 min-w-[100px]">
                    <Link
                      href={`/dashboard/leads/${lead.id}`}
                      onClick={() => toast.dismiss(t.id)}
                      className="flex-1 border border-transparent rounded-none rounded-tr-2xl px-4 py-2 flex items-center justify-center text-xs font-black text-indigo-500 hover:text-indigo-600 focus:outline-hidden hover:bg-muted/30 select-none uppercase tracking-wider text-center"
                    >
                      View Detail
                    </Link>
                    <button
                      onClick={() => dismissLeadAlert(lead.id, t.id)}
                      className="flex-1 border border-transparent rounded-none rounded-br-2xl px-4 py-2 flex items-center justify-center text-xs font-black text-rose-500 hover:text-rose-600 focus:outline-hidden hover:bg-muted/30 select-none uppercase tracking-wider cursor-pointer text-center"
                      title="Clear Alert & Mark Read"
                    >
                      Dismiss (X)
                    </button>
                  </div>
                </div>
              ),
              { duration: 8000 }
            );
          });
        }

        // Update checkpoint timestamp
        lastCheckedRef.current = new Date().toISOString();
      } catch (err) {
        console.error('Error polling for new leads:', err);
      }
    };

    // Poll every 30 seconds
    const interval = setInterval(pollForNewLeads, 30000);
    return () => clearInterval(interval);
  }, []);

  return null;
}

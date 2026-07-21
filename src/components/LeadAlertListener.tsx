'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { BellRing, BellOff, Volume2, VolumeX } from 'lucide-react';

export default function LeadAlertListener() {
  const lastCheckedRef = useRef<string>(new Date().toISOString());
  const [alertsKilled, setAlertsKilled] = useState(false);
  const [alertsMutedUntilBatch, setAlertsMutedUntilBatch] = useState(false);

  // Sync state with localStorage on mount
  useEffect(() => {
    setAlertsKilled(localStorage.getItem('lead-alerts-killed') === 'true');
    setAlertsMutedUntilBatch(localStorage.getItem('lead-alerts-muted') === 'true');
  }, []);

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

  const handleMuteUntilNewBatch = () => {
    localStorage.setItem('lead-alerts-muted', 'true');
    localStorage.setItem('lead-alerts-muted-time', new Date().toISOString());
    setAlertsMutedUntilBatch(true);
    toast.dismiss();
    toast.success('Notifications muted until the next batch of new leads arrives.', {
      id: 'mute-confirm',
      duration: 4000,
    });
  };

  const toggleKillSwitch = () => {
    const nextState = !alertsKilled;
    localStorage.setItem('lead-alerts-killed', String(nextState));
    setAlertsKilled(nextState);
    
    if (nextState) {
      toast.dismiss();
      toast.error('Lead Notification Alerts completely disabled (Kill Switch Active).', {
        id: 'kill-confirm',
        duration: 4000,
      });
    } else {
      toast.success('Lead Notification Alerts enabled.', {
        id: 'kill-confirm',
        duration: 4000,
      });
    }
  };

  useEffect(() => {
    const pollForNewLeads = async () => {
      // Respect the master kill switch
      if (localStorage.getItem('lead-alerts-killed') === 'true') {
        return;
      }

      try {
        const res = await fetch(`/api/leads/latest-unread?since=${encodeURIComponent(lastCheckedRef.current)}`);
        if (!res.ok) return;

        const data = await res.json();
        const newLeads = data.newLeads || [];

        if (newLeads.length > 0) {
          const wasMuted = localStorage.getItem('lead-alerts-muted') === 'true';
          if (wasMuted) {
            const muteTimeStr = localStorage.getItem('lead-alerts-muted-time');
            const muteTime = muteTimeStr ? new Date(muteTimeStr).getTime() : 0;
            const hasNewerLeads = newLeads.some((lead: any) => new Date(lead.createdAt).getTime() > muteTime);
            
            if (hasNewerLeads) {
              localStorage.removeItem('lead-alerts-muted');
              localStorage.removeItem('lead-alerts-muted-time');
              setAlertsMutedUntilBatch(false);
            } else {
              // Skip alert triggering
              return;
            }
          }

          // Play premium chime sound
          playNotificationChime();

          // Trigger toast for each new lead
          newLeads.forEach((lead: any) => {
            toast.custom(
              (t) => (
                <div
                  className={`${
                    t.visible ? 'animate-enter' : 'animate-leave'
                  } max-w-md w-full bg-background border border-indigo-500/20 shadow-2xl rounded-2xl pointer-events-auto flex flex-col ring-1 ring-black ring-opacity-5 overflow-hidden`}
                >
                  <div className="flex">
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
                      <a
                        href={`/dashboard/leads/${lead.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          toast.dismiss(t.id);
                          window.location.href = `/dashboard/leads/${lead.id}`;
                        }}
                        className="flex-1 border border-transparent rounded-none rounded-tr-2xl px-4 py-2 flex items-center justify-center text-xs font-black text-indigo-500 hover:text-indigo-600 focus:outline-hidden hover:bg-muted/30 select-none uppercase tracking-wider text-center"
                      >
                        View Detail
                      </a>
                      <button
                        onClick={() => dismissLeadAlert(lead.id, t.id)}
                        className="flex-1 border border-transparent rounded-none rounded-br-2xl px-4 py-2 flex items-center justify-center text-xs font-black text-rose-500 hover:text-rose-600 focus:outline-hidden hover:bg-muted/30 select-none uppercase tracking-wider cursor-pointer text-center"
                        title="Clear Alert & Mark Read"
                      >
                        Dismiss (X)
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleMuteUntilNewBatch}
                    className="w-full py-3 bg-gradient-to-r from-rose-500/10 via-indigo-500/5 to-rose-500/10 hover:from-rose-500/20 hover:to-indigo-500/15 border-t border-border/80 text-[10px] font-black text-rose-500 dark:text-rose-400 hover:text-indigo-600 dark:hover:text-indigo-400 uppercase tracking-widest text-center cursor-pointer transition-all duration-300 flex items-center justify-center gap-1.5 group hover:shadow-[inset_0_1px_12px_rgba(244,63,94,0.15)]"
                  >
                    <span className="text-xs transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">🔇</span>
                    <span>Mute Alerts Until Next Batch</span>
                  </button>
                </div>
              ),
              { duration: 15000 }
            );
          });
        }

        // Update checkpoint timestamp
        lastCheckedRef.current = new Date().toISOString();
      } catch (err) {
        console.error('Error polling for new leads:', err);
      }
    };

    // Poll every 10 minutes (6x per hour)
    const interval = setInterval(pollForNewLeads, 10 * 60 * 1000);
    
    // Perform initial check after a small delay to catch new leads on page load
    const initialTimeout = setTimeout(pollForNewLeads, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, []);

  // Render a tiny floating glassmorphism control panel in the bottom right corner
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex items-center gap-2 bg-background/80 backdrop-blur-md border border-border/60 p-2.5 rounded-2xl shadow-xl select-none transition-all hover:border-border">
      <div className="flex items-center gap-1.5 px-1.5">
        <div className={`w-2 h-2 rounded-full ${alertsKilled ? 'bg-rose-500 animate-pulse' : alertsMutedUntilBatch ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
          {alertsKilled ? 'Alerts Killed' : alertsMutedUntilBatch ? 'Alerts Muted' : 'Alerts Active'}
        </span>
      </div>
      
      <button
        onClick={toggleKillSwitch}
        className={`p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
          alertsKilled 
            ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/25' 
            : 'bg-muted/80 text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
        title={alertsKilled ? "Enable Notification Popups" : "Disable Notifications Completely (Kill Switch)"}
      >
        {alertsKilled ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
}

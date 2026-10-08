'use client';
// Workflow Sessions Panel — shows saved/resumable workflow sessions from /api/workflow-sessions.
// Lets users resume partially completed workflows (offer drafts, listing entries, etc.)
// or discard stale sessions.

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WorkflowSession {
  id: string;
  type: string;
  status: string;
  data?: Record<string, unknown>;
  leadId?: string | null;
  dealId?: string | null;
  lead?: { id: string; contact: { firstName: string; lastName: string | null } } | null;
  updatedAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  'offer-draft': 'Offer Draft',
  'listing-entry': 'Listing Entry',
  'foreclosure-intake': 'Foreclosure Intake',
  'marketing-media': 'Media Studio',
};

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: 'bg-blue-500/15 text-blue-500',
  COMPLETED: 'bg-green-500/15 text-green-500',
  ABANDONED: 'bg-gray-500/15 text-gray-500',
};

export default function WorkflowSessionsPanel() {
  const [sessions, setSessions] = useState<WorkflowSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/workflow-sessions?status=IN_PROGRESS');
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : data.sessions || []);
    } catch {
      // silent — panel is non-critical
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const discard = async (id: string) => {
    try {
      const res = await fetch(`/api/workflow-sessions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== id));
        toast.success('Session discarded');
      } else {
        toast.error('Failed to discard session');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const resumeHref = (s: WorkflowSession) => {
    const base = `/workflows/${s.type}`;
    return s.leadId ? `${base}?leadId=${s.leadId}&sessionId=${s.id}` : `${base}?sessionId=${s.id}`;
  };

  return (
    <TooltipProvider>
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">In-Progress Sessions</h2>
          <Tooltip><TooltipTrigger><span className="cursor-help text-muted-foreground text-xs">ⓘ</span></TooltipTrigger>
            <TooltipContent><p className="max-w-xs">Workflows you started but haven&apos;t finished. Resume where you left off or discard stale sessions.</p></TooltipContent></Tooltip>
        </div>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="text-sm text-muted-foreground border border-border rounded-xl p-4">
            No in-progress sessions. Start a workflow above and it will appear here if you leave before finishing.
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map(s => (
              <div key={s.id} className="bg-background border border-border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-foreground">{TYPE_LABELS[s.type] || s.type}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${STATUS_COLORS[s.status] || 'bg-gray-500/15 text-gray-500'}`}>
                      {s.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {s.lead ? `Lead: ${s.lead.contact.firstName} ${s.lead.contact.lastName || ''}` : 'No linked lead'} · Updated {new Date(s.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link href={resumeHref(s)} className="text-xs text-primary hover:underline font-medium">Resume</Link>
                  <button onClick={() => discard(s.id)} className="text-xs text-red-500 hover:underline">Discard</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

'use client';
// Client portal — external-facing dashboard for clients to view listings, documents, and messages.
// API: /api/client-portal (GET/POST portal sessions and content).

import { useState, useEffect } from 'react';
import { Globe, Plus, ExternalLink, Loader2, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function ClientPortalPage() {
  const [portals, setPortals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/client-portal').then(r => r.json()).then(d => {
      setPortals(Array.isArray(d) ? d : d.portals || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <TooltipProvider>
      <div className="p-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Globe className="w-6 h-6 text-primary" /> Client Portal
          <Tooltip><TooltipTrigger><Info className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
            <TooltipContent><p className="max-w-xs">External-facing dashboard where clients view listings, documents, and messages.</p></TooltipContent></Tooltip>
        </h1>
        <p className="text-muted-foreground mb-6 text-sm">Share a branded portal with clients to track their transaction in real time.</p>

        {loading && <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>}
        {!loading && portals.length === 0 && (
          <div className="text-center py-12 border rounded-lg">
            <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No client portals yet.</p>
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 inline-flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Create Portal
            </button>
          </div>
        )}
        <div className="divide-y rounded-lg border">
          {portals.map((p: any) => (
            <div key={p.id} className="flex items-center gap-3 p-4">
              <Globe className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1"><p className="font-medium">{p.name || p.clientName}</p><p className="text-xs text-muted-foreground">{p.url || 'Not published'}</p></div>
              <a href={p.url || '#'} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-muted rounded" title="Open portal"><ExternalLink className="w-4 h-4" /></a>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}

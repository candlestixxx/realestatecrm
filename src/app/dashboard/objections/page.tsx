'use client';
// Objection handling — AI-powered responses to common buyer/seller objections.
// API: /api/objections (GET/POST objection scenarios and responses).

import { useState, useEffect } from 'react';
import { ShieldQuestion, Plus, Loader2, Info, MessageSquare } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function ObjectionsPage() {
  const [objections, setObjections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/objections').then(r => r.json()).then(d => {
      setObjections(Array.isArray(d) ? d : d.objections || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <TooltipProvider>
      <div className="p-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <ShieldQuestion className="w-6 h-6 text-primary" /> Objection Handling
          <Tooltip><TooltipTrigger><Info className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
            <TooltipContent><p className="max-w-xs">AI-powered responses to common buyer/seller objections. Pre-built scripts for price, timing, and condition concerns.</p></TooltipContent></Tooltip>
        </h1>
        <p className="text-muted-foreground mb-6 text-sm">AI-powered responses to common buyer/seller objections.</p>
        {loading && <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>}
        {!loading && objections.length === 0 && (
          <div className="text-center py-12 border rounded-lg">
            <ShieldQuestion className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No objection scripts yet. Add common scenarios to get started.</p>
          </div>
        )}
        <div className="divide-y rounded-lg border">
          {objections.map((o: any) => (
            <div key={o.id} className="p-4">
              <div className="flex items-center gap-2 mb-1"><MessageSquare className="w-4 h-4 text-primary" /><span className="font-medium">{o.objection || o.title}</span></div>
              <p className="text-sm text-muted-foreground">{o.response || o.description}</p>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}

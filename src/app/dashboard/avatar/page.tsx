'use client';
// AI Avatar — generate AI presenter videos for listings (HeyGen integration).
// API: /api/avatar (POST with action field: create-session, speak, end-session).

import { useState } from 'react';
import { Video, Play, Loader2, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function AvatarPage() {
  const [action, setAction] = useState('create-session');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAction() {
    setLoading(true);
    try {
      const res = await fetch('/api/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      setResult(data.message || data.error || JSON.stringify(data).substring(0, 200));
    } finally { setLoading(false); }
  }

  return (
    <TooltipProvider>
      <div className="p-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Video className="w-6 h-6 text-primary" /> AI Avatar
          <Tooltip><TooltipTrigger><Info className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
            <TooltipContent><p className="max-w-xs">Generate AI presenter videos for listings using HeyGen avatars.</p></TooltipContent></Tooltip>
        </h1>
        <p className="text-muted-foreground mb-6 text-sm">Generate AI presenter videos for listings. Requires HEYGEN_API_KEY.</p>
        <div className="flex gap-2 items-center">
          <select value={action} onChange={e => setAction(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
            <option value="create-session">Create Session</option>
            <option value="speak">Speak</option>
            <option value="end-session">End Session</option>
          </select>
          <button onClick={handleAction} disabled={loading} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Run
          </button>
        </div>
        {result && <p className="mt-4 text-sm text-muted-foreground">{result}</p>}
      </div>
    </TooltipProvider>
  );
}

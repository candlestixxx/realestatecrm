'use client';
// Canva integration — design marketing materials with Canva templates.
// API: /api/canva (POST design creation/management).

import { useState } from 'react';
import { Palette, ExternalLink, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function CanvaPage() {
  const [connecting, setConnecting] = useState(false);

  // Wire Connect button to the Canva API — shows a clear error when CANVA_API_KEY is not set
  // so the button is production-ready the moment credentials arrive.
  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch('/api/canva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-session' }),
      });
      const data = await res.json();
      if (res.ok && data.authUrl) {
        window.open(data.authUrl, '_blank');
        toast.success('Redirecting to Canva authorization...');
      } else if (res.ok) {
        toast.success(data.message || 'Canva session created');
      } else {
        toast.error(data.error || 'Canva connection failed — check CANVA_API_KEY in Settings > Integrations');
      }
    } catch {
      toast.error('Network error — is the CRM server running?');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="p-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Palette className="w-6 h-6 text-primary" /> Canva Designs
          <Tooltip><TooltipTrigger><Info className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
            <TooltipContent><p className="max-w-xs">Design marketing materials with Canva templates — flyers, social posts, and listing sheets.</p></TooltipContent></Tooltip>
        </h1>
        <p className="text-muted-foreground mb-6 text-sm">Design marketing materials with Canva templates — flyers, social posts, and listing sheets.</p>
        <div className="text-center py-12 border rounded-lg">
          <Palette className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">Connect your Canva account to start designing.</p>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <ExternalLink className="w-4 h-4" /> {connecting ? 'Connecting...' : 'Connect Canva'}
          </button>
        </div>
      </div>
    </TooltipProvider>
  );
}

'use client';
// Canva integration — design marketing materials with Canva templates.
// API: /api/canva (POST design creation/management).

import {} from 'react';
import { Palette, ExternalLink, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function CanvaPage() {
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
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 inline-flex items-center gap-1.5">
            <ExternalLink className="w-4 h-4" /> Connect Canva
          </button>
        </div>
      </div>
    </TooltipProvider>
  );
}

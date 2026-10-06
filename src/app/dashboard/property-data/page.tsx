'use client';
// Property data — MLS/RESO property data lookup and enrichment.
// API: /api/property-data (GET property details, tax records, comps).

import { useState } from 'react';
import { Home, Search, Loader2, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function PropertyDataPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/property-data?address=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResult(data);
    } finally { setLoading(false); }
  }

  return (
    <TooltipProvider>
      <div className="p-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Home className="w-6 h-6 text-primary" /> Property Data
          <Tooltip><TooltipTrigger><Info className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
            <TooltipContent><p className="max-w-xs">MLS/RESO property data lookup — tax records, comps, ownership history.</p></TooltipContent></Tooltip>
        </h1>
        <p className="text-muted-foreground mb-6 text-sm">Look up property details, tax records, and comparable sales.</p>
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input placeholder="Enter property address..." value={query} onChange={e => setQuery(e.target.value)}
            className="flex-1 rounded-md border px-3 py-2 text-sm" />
          <button type="submit" disabled={loading} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Search
          </button>
        </form>
        {result && (
          <div className="rounded-lg border p-4">
            <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(result, null, 2).substring(0, 500)}</pre>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

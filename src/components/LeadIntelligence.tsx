'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

type EnrichmentData = {
  socialProfiles: { platform: string; url: string; lastSeen: string }[];
  publicRecords: { type: string; details: string; source: string }[];
};

export function LeadIntelligence({
  leadId,
  initialData,
}: {
  leadId: string;
  initialData?: string | null;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [data, setData] = useState<EnrichmentData | null>(
    initialData ? JSON.parse(initialData) : null
  );

  const runScraper = async (type: 'social' | 'public') => {
    setLoading(type);
    
    // Simulate AI Scraper logic
    const promise = new Promise<EnrichmentData>((resolve) => {
      setTimeout(() => {
        const mockData: EnrichmentData = {
          socialProfiles: [
            { platform: 'LinkedIn', url: 'https://linkedin.com/in/lead-profile', lastSeen: '2 days ago' },
            { platform: 'Facebook', url: 'https://facebook.com/lead-profile', lastSeen: '1 week ago' },
            { platform: 'X / Twitter', url: 'https://x.com/lead-handle', lastSeen: 'Today' },
          ],
          publicRecords: [
            { type: 'Property Ownership', details: 'Owned 123 Maple St since 2018', source: 'Macomb County Tax' },
            { type: 'Voter Registration', details: 'Active since 2012', source: 'MI Secretary of State' },
            { type: 'Corporate Filing', details: 'Manager at Apex Realty LLC', source: 'LARA' },
          ],
        };
        resolve(mockData);
      }, 3000);
    });

    toast.promise(promise, {
      loading: `Gemini is researching ${type === 'social' ? 'Social Media' : 'Public Records'}...`,
      success: 'Enrichment complete! Lead profile updated.',
      error: 'Scraper failed to find matching records.',
    });

    try {
      const result = await promise;
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => runScraper('social')}
          disabled={!!loading}
          className="flex-1 px-3 py-2 bg-primary/10 text-primary border border-primary/20 text-xs font-bold rounded-lg hover:bg-primary/15 transition-colors disabled:opacity-50"
        >
          {loading === 'social' ? '🔍 Researching...' : '🌐 Social Scraper'}
        </button>
        <button
          onClick={() => runScraper('public')}
          disabled={!!loading}
          className="flex-1 px-3 py-2 bg-secondary/10 text-secondary border border-secondary/20 text-xs font-bold rounded-lg hover:bg-secondary/15 transition-colors disabled:opacity-50"
        >
          {loading === 'public' ? '📄 Researching...' : '🏛️ Public Records Scraper'}
        </button>
      </div>

      {!data ? (
        <div className="p-8 border border-dashed border-border rounded-xl text-center">
          <p className="text-sm text-muted-foreground italic">
            No enrichment data yet. Run a scraper to gather intelligence on this lead.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-muted/10 border border-border rounded-xl p-4">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
              <span className="text-primary text-lg">🌐</span> Found Social Profiles
            </h3>
            <div className="space-y-2">
              {data.socialProfiles.map((p) => (
                <div key={p.platform} className="flex justify-between items-center text-sm p-2 bg-background border border-border rounded-md">
                   <div className="flex flex-col">
                      <span className="font-medium">{p.platform}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">{p.url}</span>
                   </div>
                   <span className="text-[10px] text-muted-foreground font-medium uppercase">{p.lastSeen}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-muted/10 border border-border rounded-xl p-4">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
              <span className="text-secondary text-lg">🏛️</span> Public Records Intelligence
            </h3>
            <div className="space-y-2">
              {data.publicRecords.map((r, idx) => (
                <div key={idx} className="p-2 bg-background border border-border rounded-md">
                   <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-secondary">{r.type}</span>
                      <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-bold uppercase">{r.source}</span>
                   </div>
                   <p className="text-xs text-muted-foreground">{r.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

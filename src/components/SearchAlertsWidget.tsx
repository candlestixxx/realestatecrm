'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSearchAlertAction, deleteSearchAlertAction } from '@/lib/actions/alert';
import toast from 'react-hot-toast';

type AlertData = {
  id: string;
  leadId: string;
  criteria: string; // JSON
  type: string;
  frequency: string;
  isActive: boolean;
};

export default function SearchAlertsWidget({
  leadId,
  alerts,
}: {
  leadId: string;
  alerts: AlertData[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError(null);
    const res = await createSearchAlertAction(formData);
    if (res && res.error) {
      setError(res.error);
    } else {
      toast.success('Search alert configured successfully!');
      setIsOpen(false);
      router.refresh();
    }
  }

  async function handleDelete(alertId: string) {
    setIsDeleting(alertId);
    try {
      const res = await deleteSearchAlertAction(alertId, leadId);
      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success('Alert removed.');
        router.refresh();
      }
    } catch (err) {
      toast.error('Failed to delete alert.');
    } finally {
      setIsDeleting(null);
    }
  }

  return (
    <div className="bg-background border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold">Automated MLS Search Alerts</h3>
          <p className="text-xs text-muted-foreground">Instantly alert this lead when matching MLS properties hit the market.</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="px-3 py-1.5 bg-secondary/15 text-secondary hover:bg-secondary/20 text-xs font-bold rounded-lg border border-secondary/30 transition-colors uppercase tracking-wider"
        >
          + Setup Alert
        </button>
      </div>

      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="p-8 bg-muted/10 border border-dashed border-border rounded-xl text-center text-sm text-muted-foreground">
            No automated searches configured yet. Set up one to notify the client about matches.
          </div>
        ) : (
          alerts.map(alert => {
            let parsedCriteria: { city?: string; minPrice?: number; maxPrice?: number; beds?: number; baths?: number } = {};
            try {
              parsedCriteria = JSON.parse(alert.criteria);
            } catch (e) {}

            return (
              <div key={alert.id} className="p-4 border border-border rounded-xl flex items-center justify-between hover:bg-muted/5 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">
                      📍 {parsedCriteria.city || 'All Cities'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold uppercase tracking-tight">
                      {alert.type === 'VIEW' ? 'View Details' : alert.type === 'SHOWING' ? 'Schedule Showing' : 'Write Offer'}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      ({alert.frequency})
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {parsedCriteria.minPrice || parsedCriteria.maxPrice ? (
                      `Price: $${parsedCriteria.minPrice?.toLocaleString() || '0'} - $${parsedCriteria.maxPrice?.toLocaleString() || 'Any'} • `
                    ) : null}
                    Beds: {parsedCriteria.beds || 'Any'} • Baths: {parsedCriteria.baths || 'Any'}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(alert.id)}
                  disabled={isDeleting === alert.id}
                  className="px-2.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20 disabled:opacity-50"
                >
                  {isDeleting === alert.id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            );
          })
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl border border-border shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200 text-left">
            <h3 className="font-bold text-lg mb-2">Setup MLS Property Alert</h3>
            <p className="text-xs text-muted-foreground mb-4">Identify properties matching these criteria and flag them automatically in the lead timeline.</p>
            {error && <div className="mb-4 p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg">{error}</div>}
            
            <form action={handleSubmit} className="space-y-4">
              <input type="hidden" name="leadId" value={leadId} />

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Location (City / Zip)</label>
                <input required name="city" placeholder="e.g. Troy, MI" className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Min Price ($)</label>
                  <input type="number" name="minPrice" placeholder="e.g. 250000" className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Max Price ($)</label>
                  <input type="number" name="maxPrice" placeholder="e.g. 500000" className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Beds</label>
                  <select name="beds" className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">Any</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                    <option value="5">5+</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Baths</label>
                  <select name="baths" className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">Any</option>
                    <option value="1">1+</option>
                    <option value="1.5">1.5+</option>
                    <option value="2">2+</option>
                    <option value="2.5">2.5+</option>
                    <option value="3">3+</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Alert Match Intent</label>
                  <select name="type" className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="VIEW">View Property Details</option>
                    <option value="SHOWING">Schedule showing alert</option>
                    <option value="OFFER">Draft buy-side offer</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Frequency</label>
                  <select name="frequency" className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="INSTANT">Real-time / Instant</option>
                    <option value="DAILY">Daily Digests</option>
                    <option value="WEEKLY">Weekly Updates</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-md hover:bg-primary/90 transition-colors shadow-lg"
                >
                  Create Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, CheckCircle2, AlertCircle } from 'lucide-react';

interface DealOption {
  id: string;
  title: string;
}

interface PipelineTriggerPanelProps {
  deals: DealOption[];
  activeListingId?: string;
}

export function PipelineTriggerPanel({ deals, activeListingId }: PipelineTriggerPanelProps) {
  const router = useRouter();
  const [selectedDealId, setSelectedDealId] = useState(activeListingId || '');
  const [customAddress, setCustomAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMsg(null);

    // Find property details
    let listingId = selectedDealId;
    let address = customAddress;

    if (selectedDealId && selectedDealId !== 'custom') {
      const deal = deals.find(d => d.id === selectedDealId);
      address = deal ? deal.title : '123 Main St';
    } else {
      listingId = `custom-${Date.now()}`;
      if (!address.trim()) {
        setStatusMsg({ type: 'error', text: 'Please enter a property address.' });
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/workflows/media-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'manual.trigger',
          listingId,
          address,
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatusMsg({ type: 'success', text: `Successfully generated and saved media assets for: ${address}` });
        // Redirect to reload the page with active listing context
        setTimeout(() => {
          router.push(`/workflows/marketing-media?listingId=${listingId}`);
          router.refresh();
        }, 1500);
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Failed to trigger media pipeline.' });
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Network connection error.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-muted/30 border border-border rounded-xl p-6">
      <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
        <Play className="w-5 h-5 text-secondary" />
        Initialize Media Pipeline Workflow
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Select an active property deal from the CRM or enter a manual address to fetch directories, write AI copy, and trigger asset workflows.
      </p>

      <form onSubmit={handleTrigger} className="space-y-4 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Select CRM Deal/Property
            </label>
            <select
              value={selectedDealId}
              onChange={(e) => {
                setSelectedDealId(e.target.value);
                if (e.target.value !== 'custom') setCustomAddress('');
              }}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-secondary"
            >
              <option value="">-- Choose a Deal --</option>
              {deals.map((deal) => (
                <option key={deal.id} value={deal.id}>
                  {deal.title}
                </option>
              ))}
              <option value="custom">-- Enter Manual Address --</option>
            </select>
          </div>

          {(selectedDealId === 'custom' || !selectedDealId) && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Property Address
              </label>
              <input
                type="text"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                placeholder="e.g. 123 Main St"
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-secondary"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md font-semibold hover:bg-secondary/90 disabled:opacity-50 transition-colors"
        >
          {isLoading ? (
            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
          Run Media Pipeline
        </button>
      </form>

      {statusMsg && (
        <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 text-sm max-w-2xl ${
          statusMsg.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import CampaignEditor from './CampaignEditor';
import { createCampaignAction, toggleCampaignStatusAction } from '@/lib/actions/campaign';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

type CampaignData = {
  id: string;
  name: string;
  description: string | null;
  steps: string | null;
  isActive: boolean;
  createdAt: Date;
  _count?: { leads: number };
};

export default function CampaignsListClient({
  campaigns,
}: {
  campaigns: CampaignData[];
}) {
  const [activeEditorId, setActiveEditorId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const activeCampaign = campaigns.find(c => c.id === activeEditorId);

  const handleCreate = async (formData: FormData) => {
    setError(null);
    const res = await createCampaignAction(formData);
    if (res && res.error) {
      setError(res.error);
    } else {
      toast.success('Drip Campaign created successfully!');
      setIsAdding(false);
      router.refresh();
      // Automatically open editor for newly created campaign
      if (res.campaignId) {
        setActiveEditorId(res.campaignId);
      }
    }
  };

  const handleToggle = async (campaignId: string, currentStatus: boolean) => {
    try {
      const res = await toggleCampaignStatusAction(campaignId, !currentStatus);
      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Campaign ${!currentStatus ? 'Activated' : 'Paused'}`);
        router.refresh();
      }
    } catch (e) {
      toast.error('Network error toggling status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Drip Campaigns</h1>
          <p className="text-muted-foreground">Build automated follow-ups via Text, Email, and task scheduling.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-sm"
        >
          Create Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map(c => {
          let stepCount = 0;
          try {
            if (c.steps) stepCount = JSON.parse(c.steps).length;
          } catch (e) {}

          return (
            <div
              key={c.id}
              className={`bg-background border border-border rounded-xl shadow-sm overflow-hidden flex flex-col hover:border-primary/50 transition-all group ${
                !c.isActive ? 'opacity-70' : ''
              }`}
            >
              <div className="p-6 flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
                    🤖
                  </div>
                  <button
                    onClick={() => handleToggle(c.id, c.isActive)}
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                      c.isActive
                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {c.isActive ? 'Active' : 'Paused'}
                  </button>
                </div>

                <div>
                  <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                    {c.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 min-h-[32px] line-clamp-2">
                    {c.description || 'No description provided.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 text-center border-t border-border/50">
                  <div>
                    <span className="block font-bold text-lg text-foreground">{stepCount}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Steps</span>
                  </div>
                  <div>
                    <span className="block font-bold text-lg text-foreground">{c._count?.leads || 0}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Enrolled</span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-muted/20 border-t border-border flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  Created {new Date(c.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => setActiveEditorId(c.id)}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Configure Steps &rarr;
                </button>
              </div>
            </div>
          );
        })}

        {campaigns.length === 0 && (
          <div className="col-span-full py-16 border border-dashed border-border rounded-xl text-center text-muted-foreground">
            No Drip Campaigns created yet. Click &ldquo;Create Campaign&rdquo; above to start!
          </div>
        )}
      </div>

      {/* Campaign Steps Editor Modal */}
      {activeCampaign && (
        <CampaignEditor
          campaignId={activeCampaign.id}
          campaignName={activeCampaign.name}
          initialSteps={activeCampaign.steps}
          onClose={() => {
            setActiveEditorId(null);
            router.refresh();
          }}
        />
      )}

      {/* Creation Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl border border-border shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-lg mb-2">Create Drip Campaign</h3>
            <p className="text-xs text-muted-foreground mb-4">Set up an automated sequence of touchpoints to convert prospects.</p>
            {error && <div className="mb-4 p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg">{error}</div>}

            <form action={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Campaign Name</label>
                <input required name="name" placeholder="e.g. Buyer Lead Follow-up" className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
                <textarea name="description" rows={3} placeholder="Describe the target audience or drip strategy..." className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-md hover:bg-primary/90 transition-colors shadow-lg"
                >
                  Save & Setup Steps
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

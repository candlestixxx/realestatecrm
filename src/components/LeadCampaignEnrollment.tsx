'use client';

import { useState } from 'react';
import { enrollLeadInCampaignAction } from '@/lib/actions/campaign';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

type CampaignOption = {
  id: string;
  name: string;
};

export default function LeadCampaignEnrollment({
  leadId,
  activePlanId,
  campaigns,
}: {
  leadId: string;
  activePlanId: string | null;
  campaigns: CampaignOption[];
}) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(activePlanId || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const handleEnroll = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const campaignId = e.target.value;
    setIsUpdating(true);
    try {
      const res = await enrollLeadInCampaignAction(leadId, campaignId || null);
      if (res && res.error) {
        toast.error(res.error);
        setSelectedPlanId(selectedPlanId); // Revert
      } else {
        setSelectedPlanId(campaignId);
        toast.success(campaignId ? 'Enrolled in campaign!' : 'Unenrolled from campaign.');
        router.refresh();
      }
    } catch (err) {
      toast.error('Network error during enrollment.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 bg-muted/20 border border-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          🤖
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm">Automated Drip Campaign</span>
          <span className="text-xs text-muted-foreground">Select a Drip Campaign to automate emails, texts, and task prompts.</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <select
          value={selectedPlanId}
          disabled={isUpdating}
          onChange={handleEnroll}
          className="w-full sm:w-48 bg-background border border-border rounded px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 appearance-none h-[34px]"
        >
          <option value="">-- Unenrolled --</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {isUpdating && (
          <span className="w-2 h-2 bg-primary rounded-full animate-ping shrink-0"></span>
        )}
      </div>
    </div>
  );
}

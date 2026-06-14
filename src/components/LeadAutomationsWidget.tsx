'use client';

import { useState, useMemo } from 'react';
import { enrollLeadInCampaignAction } from '@/lib/actions/campaign';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

type CampaignOption = {
  id: string;
  name: string;
  description: string | null;
  steps: string | null;
};

export default function LeadAutomationsWidget({
  leadId,
  activePlanId,
  campaigns,
}: {
  leadId: string;
  activePlanId: string | null;
  campaigns: CampaignOption[];
}) {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [planCategory, setPlanCategory] = useState<'company' | 'office' | 'my'>('company');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const activePlan = useMemo(() => {
    return campaigns.find((c) => c.id === activePlanId);
  }, [campaigns, activePlanId]);

  // Visual steps sequence parser for active plan
  const activeSteps = useMemo(() => {
    if (!activePlan || !activePlan.steps) return [];
    try {
      const parsed = JSON.parse(activePlan.steps);
      return parsed.items || (Array.isArray(parsed) ? parsed : []);
    } catch {
      return [];
    }
  }, [activePlan]);

  // Selected plan in enrollment modal
  const previewPlan = useMemo(() => {
    return campaigns.find((c) => c.id === selectedPlanId);
  }, [campaigns, selectedPlanId]);

  const previewSteps = useMemo(() => {
    if (!previewPlan || !previewPlan.steps) return [];
    try {
      const parsed = JSON.parse(previewPlan.steps);
      return parsed.items || (Array.isArray(parsed) ? parsed : []);
    } catch {
      return [];
    }
  }, [previewPlan]);

  const previewSettings = useMemo(() => {
    if (!previewPlan || !previewPlan.steps) return {};
    try {
      const parsed = JSON.parse(previewPlan.steps);
      return parsed.settings || {};
    } catch {
      return {};
    }
  }, [previewPlan]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Mock filter categories
      if (planCategory === 'my') {
        return c.name.toLowerCase().includes('elrt') || c.name.toLowerCase().includes('gpt');
      }
      return true;
    });
  }, [campaigns, planCategory, searchQuery]);

  const handleEnroll = async (campaignId: string | null) => {
    setIsSubmitting(true);
    try {
      const res = await enrollLeadInCampaignAction(leadId, campaignId);
      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success(campaignId ? 'Smart Plan applied to lead!' : 'Smart Plan stopped/unenrolled.');
        setShowApplyModal(false);
        router.refresh();
      }
    } catch (e) {
      toast.error('Network error modifying smart plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Automations Tab Panel - Lofty Styled */}
      <div className="bg-background border border-border rounded-xl shadow-sm p-5 space-y-6">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <h3 className="font-extrabold text-base text-foreground">Smart Plans</h3>
            <p className="text-xs text-muted-foreground">Automate follow-up campaigns and client outreach workflow paths.</p>
          </div>
          {!activePlanId && (
            <button
              onClick={() => {
                if (campaigns.length > 0) {
                  setSelectedPlanId(campaigns[0].id);
                }
                setShowApplyModal(true);
              }}
              className="px-3.5 py-1.5 bg-primary text-primary-foreground font-bold rounded-lg text-xs hover:bg-primary/95 transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
            >
              + Apply Smart Plan
            </button>
          )}
        </div>

        {activePlan ? (
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Active Plan
                </span>
                <h4 className="font-bold text-base text-foreground mt-1">{activePlan.name}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                  {activePlan.description || 'Currently running automated sequence for this contact.'}
                </p>
              </div>

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to STOP and remove this Smart Plan? All scheduled pending actions will be cleared.')) {
                    handleEnroll(null);
                  }
                }}
                disabled={isSubmitting}
                className="px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-lg text-xs font-bold uppercase transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                Stop Smart Plan
              </button>
            </div>

            {/* Smart Plan Steps Visual Roadmap */}
            <div className="space-y-2 border-t border-border pt-4">
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest block">Outreach Sequence Execution</span>
              
              <div className="flex flex-col gap-2 pl-3 relative border-l-2 border-primary/20 py-2">
                {activeSteps.map((step: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 relative">
                    <span className="w-4 h-4 rounded-full bg-primary/20 border border-primary text-primary text-[8px] font-black flex items-center justify-center shrink-0 mt-0.5 -ml-[19px]">
                      {idx + 1}
                    </span>
                    <div className="flex-1 bg-muted/10 border border-border/40 p-2.5 rounded-lg text-xs">
                      <span className="font-bold text-foreground">
                        {step.type === 'EMAIL' ? '✉️ Email Outreach' :
                         step.type === 'SMS' ? '💬 SMS Text Message' :
                         step.type === 'CALL' ? '📞 Schedule Phone Call' : '⚡ General Task Alert'}
                      </span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        Delay: {step.delayValue} {step.delayUnit.toLowerCase()}s
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-1 bg-background/50 p-2 rounded border border-border/30 truncate">
                        {step.type === 'EMAIL' ? `Subject: ${step.subject || ''} - ${step.content}` : step.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 border border-dashed border-border rounded-xl bg-muted/5">
            <span className="text-2xl block mb-2">🤖</span>
            <p className="text-xs text-muted-foreground italic mb-4">No Smart Plan currently applied to this lead.</p>
            <button
              onClick={() => {
                if (campaigns.length > 0) {
                  setSelectedPlanId(campaigns[0].id);
                }
                setShowApplyModal(true);
              }}
              className="px-4 py-2 bg-secondary text-secondary-foreground font-bold rounded-lg text-xs hover:bg-secondary/95 transition-all shadow-sm"
            >
              Configure & Enroll Lead
            </button>
          </div>
        )}
      </div>

      {/* Lofty-Style "APPLY NEW PLAN" Modal (Matches image 3) */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/10 shrink-0">
              <h3 className="font-black text-sm uppercase tracking-wider text-foreground">Apply New Plan</h3>
              <button 
                onClick={() => setShowApplyModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body split into Sidebar list (Left) and Canvas Preview (Right) */}
            <div className="flex-1 flex overflow-hidden min-h-0">
              
              {/* Left sidebar select plan list */}
              <div className="w-72 border-r border-border flex flex-col overflow-hidden shrink-0">
                {/* Categories tabs */}
                <div className="flex border-b border-border text-[10px] uppercase font-bold text-center select-none bg-muted/20 shrink-0">
                  <button
                    onClick={() => setPlanCategory('company')}
                    className={`flex-1 py-2.5 border-b-2 transition-all ${
                      planCategory === 'company' ? 'border-primary text-primary bg-background' : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Company Plans
                  </button>
                  <button
                    onClick={() => setPlanCategory('office')}
                    className={`flex-1 py-2.5 border-b-2 transition-all ${
                      planCategory === 'office' ? 'border-primary text-primary bg-background' : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Office Plans
                  </button>
                  <button
                    onClick={() => setPlanCategory('my')}
                    className={`flex-1 py-2.5 border-b-2 transition-all ${
                      planCategory === 'my' ? 'border-primary text-primary bg-background' : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    My Plans
                  </button>
                </div>

                {/* Plan Search */}
                <div className="p-3 border-b border-border shrink-0">
                  <input
                    type="text"
                    placeholder="Search plan name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-muted/30 border border-border rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none"
                  />
                </div>

                {/* Vertical Scroll List */}
                <div className="flex-1 overflow-y-auto divide-y divide-border/60">
                  {filteredCampaigns.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`w-full text-left p-3 text-xs block transition-all ${
                        selectedPlanId === plan.id ? 'bg-primary/5 text-primary border-l-4 border-primary' : 'hover:bg-muted/30 text-foreground'
                      }`}
                    >
                      <span className="font-bold block text-sm truncate">{plan.name}</span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5 line-clamp-2 leading-tight">
                        {plan.description || 'No description provided.'}
                      </span>
                    </button>
                  ))}

                  {filteredCampaigns.length === 0 && (
                    <div className="p-6 text-center text-xs text-muted-foreground italic">
                      No matching plans.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel: Canvas Flow Chart Preview */}
              <div className="flex-1 bg-muted/5 p-6 overflow-y-auto flex flex-col items-center select-none">
                {previewPlan ? (
                  <div className="w-full max-w-xl space-y-4 flex flex-col items-center">
                    
                    {/* Settings card */}
                    <div className="w-full bg-background border border-border rounded-xl p-4 shadow-sm space-y-2 text-xs">
                      <span className="text-[10px] font-black uppercase text-muted-foreground block">Drip Plan settings</span>
                      <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                        <div>Scope: <strong className="text-foreground">{previewSettings.scope || 'Company'}</strong></div>
                        <div>Target Lead Type: <strong className="text-foreground">{previewSettings.leadType || 'Both'}</strong></div>
                        <div>Triggers: <strong className="text-foreground">{previewSettings.autoApplyTrigger || 'None'}</strong></div>
                        <div>Pause on: <strong className="text-foreground">{previewSettings.autoPauseOn || 'Reply'}</strong></div>
                      </div>
                    </div>

                    {/* Visual flow WHEN block */}
                    <div className="w-full bg-background border-2 border-primary/50 shadow-md rounded-xl p-4 relative flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                        WHEN
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-primary uppercase">Trigger Application</span>
                        <span className="block font-bold text-sm text-foreground">Enrolled on Lead</span>
                      </div>
                    </div>

                    {/* Visual Nodes connector */}
                    <div className="w-0.5 h-8 bg-border"></div>

                    {/* Visual flow DO steps */}
                    {previewSteps.map((step: any, index: number) => (
                      <div key={step.id} className="w-full flex flex-col items-center">
                        <div className="w-full bg-background border border-border shadow-sm rounded-xl overflow-hidden">
                          <div className="bg-muted/30 px-4 py-2.5 border-b border-border flex items-center justify-between text-xs">
                            <span className="font-extrabold uppercase text-foreground">
                              {step.type === 'EMAIL' ? '✉️ DO Auto Email' :
                               step.type === 'SMS' ? '💬 DO Auto Text' :
                               step.type === 'CALL' ? '📞 DO Call Task' : '⚡ DO General Task'}
                            </span>
                            <span className="font-bold text-[10px] text-muted-foreground">
                              Delay: {step.delayValue} {step.delayUnit.toLowerCase()}
                            </span>
                          </div>
                          <div className="p-3.5 text-xs text-muted-foreground leading-relaxed">
                            {step.type === 'EMAIL' && <strong className="text-foreground block mb-1">Subject: {step.subject}</strong>}
                            <p className="whitespace-pre-wrap">{step.content}</p>
                          </div>
                        </div>

                        {index < previewSteps.length - 1 && (
                          <div className="w-0.5 h-8 bg-border"></div>
                        )}
                      </div>
                    ))}

                  </div>
                ) : (
                  <div className="text-center py-20 text-muted-foreground italic text-xs">
                    Select a Smart Plan from the sidebar to preview the flowchart sequence.
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border bg-muted/10 flex justify-between items-center shrink-0">
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="px-4 py-2 border border-border hover:bg-muted text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              
              <button
                type="button"
                disabled={isSubmitting || !selectedPlanId}
                onClick={() => handleEnroll(selectedPlanId)}
                className="px-6 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Applying...' : 'Apply Plan'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

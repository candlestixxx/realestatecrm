'use client';

import { useState } from 'react';
import { updateCampaignStepsAction } from '@/lib/actions/campaign';
import toast from 'react-hot-toast';

type CampaignStep = {
  id: string;
  type: 'EMAIL' | 'SMS' | 'CALL' | 'TASK';
  delayDays: number;
  subject?: string;
  content: string;
};

export default function CampaignEditor({
  campaignId,
  campaignName,
  initialSteps,
  onClose,
}: {
  campaignId: string;
  campaignName: string;
  initialSteps: string | null;
  onClose: () => void;
}) {
  const [steps, setSteps] = useState<CampaignStep[]>(() => {
    try {
      return initialSteps ? JSON.parse(initialSteps) : [];
    } catch (e) {
      return [];
    }
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleStepChange = (index: number, field: keyof CampaignStep, value: any) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const handleAddStep = () => {
    const newStep: CampaignStep = {
      id: Math.random().toString(36).substring(7),
      type: 'EMAIL',
      delayDays: 1,
      subject: 'Follow-up Email',
      content: 'Write your content here...',
    };
    setSteps([...steps, newStep]);
  };

  const handleDeleteStep = (index: number) => {
    setSteps(steps.filter((_, idx) => idx !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await updateCampaignStepsAction(campaignId, JSON.stringify(steps));
      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success('Drip steps saved successfully!');
        onClose();
      }
    } catch (err) {
      toast.error('Failed to save drip steps.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-background rounded-2xl border border-border shadow-2xl p-6 w-full max-w-3xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
          <div>
            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5 font-bold uppercase tracking-wider">
              Drip Builder
            </span>
            <h3 className="text-xl font-bold mt-1">Configure &ldquo;{campaignName}&rdquo;</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {steps.map((step, index) => (
            <div key={step.id} className="p-4 border border-border rounded-xl bg-muted/10 relative space-y-4">
              {/* Header and Step Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    {index + 1}
                  </span>
                  <select
                    value={step.type}
                    onChange={(e) => handleStepChange(index, 'type', e.target.value)}
                    className="bg-background border border-border rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="EMAIL">✉️ Email Message</option>
                    <option value="SMS">💬 SMS Text</option>
                    <option value="CALL">📞 Log Call Task</option>
                    <option value="TASK">⚡ General Task</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Trigger after:</label>
                  <input
                    type="number"
                    value={step.delayDays}
                    onChange={(e) => handleStepChange(index, 'delayDays', Number(e.target.value))}
                    className="w-16 bg-background border border-border rounded px-2 py-1 text-xs text-center focus:outline-none"
                    min="0"
                  />
                  <span className="text-xs text-muted-foreground">days</span>
                </div>
              </div>

              {/* Specific forms depending on action type */}
              {step.type === 'EMAIL' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Email Subject</label>
                    <input
                      type="text"
                      value={step.subject || ''}
                      onChange={(e) => handleStepChange(index, 'subject', e.target.value)}
                      placeholder="Email Subject Line"
                      className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Email Body</label>
                    <textarea
                      value={step.content}
                      onChange={(e) => handleStepChange(index, 'content', e.target.value)}
                      placeholder="Email body text..."
                      rows={3}
                      className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>
                </div>
              )}

              {step.type === 'SMS' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">SMS Message Content</label>
                  <textarea
                    value={step.content}
                    onChange={(e) => handleStepChange(index, 'content', e.target.value)}
                    placeholder="Type SMS text..."
                    rows={2}
                    className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>
              )}

              {(step.type === 'CALL' || step.type === 'TASK') && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Task Title / Details</label>
                  <input
                    type="text"
                    value={step.content}
                    onChange={(e) => handleStepChange(index, 'content', e.target.value)}
                    placeholder={step.type === 'CALL' ? 'Call lead to discuss properties...' : 'Upload disclosures to portal...'}
                    className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => handleDeleteStep(index)}
                className="absolute top-1 right-2 text-xs text-red-500 hover:text-red-600 p-1 opacity-50 hover:opacity-100 transition-opacity"
              >
                Delete
              </button>
            </div>
          ))}

          {steps.length === 0 && (
            <div className="text-center py-12 border border-dashed border-border rounded-xl">
              <p className="text-sm text-muted-foreground italic mb-2">No steps in this campaign.</p>
              <button
                type="button"
                onClick={handleAddStep}
                className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 text-xs font-bold rounded-lg hover:bg-primary/20"
              >
                + Add First Step
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-border pt-4 mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={handleAddStep}
            className="px-4 py-2 border border-border hover:bg-muted text-xs font-bold rounded-lg transition-colors"
          >
            + Add Action Step
          </button>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium hover:bg-muted rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-6 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Steps'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

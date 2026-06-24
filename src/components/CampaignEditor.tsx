'use client';

import { useState } from 'react';
import { updateCampaignStepsAction, toggleCampaignStatusAction } from '@/lib/actions/campaign';
import toast from 'react-hot-toast';

type DelayUnit = 'SECOND' | 'MINUTE' | 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

type CampaignStep = {
  id: string;
  type: 'EMAIL' | 'SMS' | 'CALL' | 'TASK';
  delayValue: number;
  delayUnit: DelayUnit;
  title?: string;
  subject?: string;
  content: string;
  assignee?: string;
};

type CampaignSettings = {
  scope: string; // COMPANY | PERSONAL
  leadType: string; // BUYER | SELLER | BOTH
  autoApplyTrigger: string; // NONE | LEAD_CREATED | ASSIGNMENT_CHANGED | SEGMENT_MATCHED | TAG_ADDED | STAGE_CHANGED | LEAD_TRANSFERRED
  autoApplyCriteria: string; // segmentId, tag name, or pipeline stage
  autoPauseOn: 'REPLY' | 'STAGE_CHANGE' | 'NONE';
};

export default function CampaignEditor({
  campaignId,
  campaignName,
  initialSteps,
  initialActive = true,
  segments = [],
  onClose,
}: {
  campaignId: string;
  campaignName: string;
  initialSteps: string | null;
  initialActive?: boolean;
  segments?: { id: string; name: string }[];
  onClose: () => void;
}) {
  // Parsing states
  const [settings, setSettings] = useState<CampaignSettings>(() => {
    try {
      if (initialSteps) {
        const parsed = JSON.parse(initialSteps);
        if (parsed.settings) {
          return {
            scope: parsed.settings.scope || 'COMPANY',
            leadType: parsed.settings.leadType || 'BOTH',
            autoApplyTrigger: parsed.settings.autoApplyTrigger || 'NONE',
            autoApplyCriteria: parsed.settings.autoApplyCriteria || '',
            autoPauseOn: parsed.settings.autoPauseOn || 'REPLY',
          };
        }
      }
    } catch (e) {}
    return {
      scope: 'COMPANY',
      leadType: 'BOTH',
      autoApplyTrigger: 'NONE',
      autoApplyCriteria: '',
      autoPauseOn: 'REPLY',
    };
  });

  const [steps, setSteps] = useState<CampaignStep[]>(() => {
    try {
      if (initialSteps) {
        const parsed = JSON.parse(initialSteps);
        const list = parsed.items || (Array.isArray(parsed) ? parsed : []);
        return list.map((step: any) => {
          // Legacy check
          if (step.delayDays !== undefined && step.delayValue === undefined) {
            return {
              id: step.id,
              type: step.type,
              delayValue: step.delayDays,
              delayUnit: 'DAY',
              title: step.title || '',
              subject: step.subject,
              content: step.content,
            };
          }
          return {
            ...step,
            title: step.title || '',
            delayValue: step.delayValue ?? 1,
            delayUnit: step.delayUnit ?? 'DAY',
          };
        });
      }
    } catch (e) {}
    return [];
  });

  const [isActive, setIsActive] = useState(initialActive);
  const [isSaving, setIsSaving] = useState(false);

  const handleStepChange = (index: number, field: keyof CampaignStep, value: any) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const handleAddStep = (type: 'EMAIL' | 'SMS' | 'CALL' | 'TASK' = 'EMAIL') => {
    const newStep: CampaignStep = {
      id: Math.random().toString(36).substring(7),
      type,
      delayValue: 1,
      delayUnit: 'DAY',
      title: '',
      subject: type === 'EMAIL' ? 'Follow-up Email' : undefined,
      content: type === 'EMAIL' ? 'Hi! Just wanted to follow up...' : type === 'SMS' ? 'Hi! Let me know if we can chat.' : 'Follow up with lead.',
    };
    setSteps([...steps, newStep]);
  };

  const handleDeleteStep = (index: number) => {
    setSteps(steps.filter((_, idx) => idx !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Save steps content
      const payload = {
        settings,
        items: steps,
      };
      const res = await updateCampaignStepsAction(campaignId, JSON.stringify(payload));
      if (res && res.error) {
        toast.error(res.error);
        setIsSaving(false);
        return;
      }

      // 2. Toggle active/paused status if modified
      if (isActive !== initialActive) {
        const statusRes = await toggleCampaignStatusAction(campaignId, isActive);
        if (statusRes && statusRes.error) {
          toast.error(statusRes.error);
        }
      }

      toast.success('Campaign saved successfully!');
      onClose();
    } catch (err) {
      toast.error('Failed to save campaign steps.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 bg-primary/10 text-primary border border-primary/20 rounded-xl flex items-center justify-center text-xl font-bold">
              ⚡
            </span>
            <div>
              <h3 className="text-lg font-black text-foreground">{campaignName}</h3>
              <p className="text-xs text-muted-foreground">Smart Plan & Drip Campaign Visual Canvas Builder</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content splits into Settings Panel (Left) & Canvas Area (Right) */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          
          {/* Left Panel: Settings */}
          <div className="w-80 border-r border-border bg-muted/20 p-5 overflow-y-auto space-y-6 select-none shrink-0">
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Plan Settings</h4>
              
              <div className="space-y-4">
                {/* Active / Paused Status Selection */}
                <div className="space-y-1.5 pb-2">
                  <label className="text-xs font-bold text-foreground">Campaign Status</label>
                  <select
                    value={isActive ? 'active' : 'paused'}
                    onChange={(e) => setIsActive(e.target.value === 'active')}
                    className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none font-bold"
                  >
                    <option value="active">🟢 Active (Running)</option>
                    <option value="paused">🔴 Paused (Deactivated)</option>
                  </select>
                  <p className="text-[10px] text-muted-foreground">Deactivated plans will pause triggers and automatic executions.</p>
                </div>

                {/* Scope */}
                <div className="space-y-1.5 border-t border-border pt-4">
                  <label className="text-xs font-bold text-foreground">Plan Scope</label>
                  <select
                    value={settings.scope}
                    onChange={(e) => setSettings({ ...settings, scope: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="COMPANY">Company Plan</option>
                    <option value="PERSONAL">Personal Plan</option>
                  </select>
                  <p className="text-[10px] text-muted-foreground">Company plans apply to all team/brokerage leads.</p>
                </div>

                {/* Target Lead Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Target Lead Type</label>
                  <select
                    value={settings.leadType}
                    onChange={(e) => setSettings({ ...settings, leadType: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="BOTH">Include Both (Buyer & Seller)</option>
                    <option value="BUYER">Equals to Buyer</option>
                    <option value="SELLER">Equals to Seller</option>
                  </select>
                </div>

                {/* Auto Apply settings */}
                <div className="space-y-1.5 border-t border-border pt-4">
                  <label className="text-xs font-bold text-foreground">Auto Apply Trigger</label>
                  <select
                    value={settings.autoApplyTrigger}
                    onChange={(e: any) => setSettings({ ...settings, autoApplyTrigger: e.target.value, autoApplyCriteria: '' })}
                    className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="NONE">Manual Enrollment Only</option>
                    <option value="LEAD_CREATED">When Lead Created / Comes In</option>
                    <option value="ASSIGNMENT_CHANGED">When Lead Assigned / Reassigned</option>
                    <option value="LEAD_TRANSFERRED">When Lead Transferred</option>
                    <option value="TAG_ADDED">When Specific Tag / Hashtag Added</option>
                    <option value="STAGE_CHANGED">When Pipeline Stage Changes</option>
                    <option value="SEGMENT_MATCHED">When Lead Meets Segment Conditions</option>
                  </select>
                </div>

                {/* Auto Apply Criteria */}
                {settings.autoApplyTrigger === 'SEGMENT_MATCHED' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Select Segment Criteria</label>
                    <select
                      value={settings.autoApplyCriteria}
                      onChange={(e) => setSettings({ ...settings, autoApplyCriteria: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <option value="">-- Choose Segment --</option>
                      {segments.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {settings.autoApplyTrigger === 'TAG_ADDED' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Target Tag Name (e.g. preforeclosure)</label>
                    <input
                      type="text"
                      required
                      value={settings.autoApplyCriteria}
                      onChange={(e) => setSettings({ ...settings, autoApplyCriteria: e.target.value })}
                      placeholder="e.g. expired, preforeclosure"
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                )}

                {settings.autoApplyTrigger === 'STAGE_CHANGED' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Select Target Stage</label>
                    <select
                      value={settings.autoApplyCriteria}
                      onChange={(e) => setSettings({ ...settings, autoApplyCriteria: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <option value="">-- Choose Stage --</option>
                      <option value="NEW">New Lead</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="QUALIFIED">Qualified</option>
                      <option value="PREFORECLOSURE">Preforeclosure</option>
                      <option value="UNDER_CONTRACT">Under Contract / Pending</option>
                      <option value="CLOSED">Closed Deal</option>
                    </select>
                  </div>
                )}

                {settings.autoApplyTrigger === 'LEAD_TRANSFERRED' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Transferred Office / Agent Name</label>
                    <input
                      type="text"
                      required
                      value={settings.autoApplyCriteria}
                      onChange={(e) => setSettings({ ...settings, autoApplyCriteria: e.target.value })}
                      placeholder="e.g. Excel Office A, Agent Mendez"
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                )}

                {/* Auto Pause settings */}
                <div className="space-y-1.5 border-t border-border pt-4">
                  <label className="text-xs font-bold text-foreground">Auto Pause Setting</label>
                  <select
                    value={settings.autoPauseOn}
                    onChange={(e: any) => setSettings({ ...settings, autoPauseOn: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="REPLY">Pause when Lead Replies (SMS/Email)</option>
                    <option value="STAGE_CHANGE">Pause when Pipeline Stage changes</option>
                    <option value="NONE">Never pause automatically</option>
                  </select>
                </div>

              </div>
            </div>
          </div>

          {/* Right Panel: Canvas Flow */}
          <div className="flex-1 bg-muted/5 p-6 overflow-y-auto flex flex-col items-center">
            
            {/* Visual Start / WHEN block */}
            <div className="w-full max-w-xl bg-background border-2 border-primary/50 shadow-md rounded-xl p-4 relative flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                WHEN
              </div>
              <div className="flex-1">
                <span className="text-xs font-black uppercase text-primary tracking-wide">Trigger Event</span>
                <span className="block font-bold text-sm text-foreground">
                  {settings.autoApplyTrigger === 'NONE' ? 'Manual Enrollment Triggered' :
                   settings.autoApplyTrigger === 'LEAD_CREATED' ? 'New Lead Intake / Created' :
                   settings.autoApplyTrigger === 'ASSIGNMENT_CHANGED' ? 'Lead Assigned or Reassigned' :
                   `Lead added to Segment: "${segments.find(s => s.id === settings.autoApplyCriteria)?.name || '...'}"`}
                </span>
              </div>
            </div>

            {/* Vertical connector line */}
            <div className="w-0.5 h-8 bg-border"></div>

            {/* Steps Rendering */}
            {steps.map((step, index) => (
              <div key={step.id} className="w-full max-w-xl flex flex-col items-center">
                
                {/* Visual Step Block */}
                <div className="w-full bg-background border border-border shadow-sm rounded-xl overflow-hidden hover:border-slate-500 transition-all relative group">
                  
                  {/* Step Card Header */}
                  <div className="bg-muted/30 px-4 py-2.5 border-b border-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-secondary/20 text-secondary-foreground flex items-center justify-center font-bold text-[10px]">
                        {index + 1}
                      </span>
                      <span className="font-extrabold text-xs text-foreground uppercase tracking-wide">
                        {step.type === 'EMAIL' ? `✉️ DO Auto Email - "${step.title || 'Untitled Email'}"` :
                         step.type === 'SMS' ? `💬 DO Auto Text - "${step.title || 'Untitled SMS'}"` :
                         step.type === 'CALL' ? `📞 DO Call Task - "${step.title || 'Untitled Call'}"` : 
                         `⚡ DO General Task - "${step.title || 'Untitled Task'}"`}
                      </span>
                    </div>

                    {/* Delay settings */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Delay:</span>
                      <input
                        type="number"
                        value={step.delayValue}
                        onChange={(e) => handleStepChange(index, 'delayValue', Math.max(0, Number(e.target.value)))}
                        className="w-10 bg-background border border-border rounded text-center py-0.5 font-bold focus:outline-none"
                      />
                      <select
                        value={step.delayUnit}
                        onChange={(e) => handleStepChange(index, 'delayUnit', e.target.value)}
                        className="bg-background border border-border rounded py-0.5 px-1 font-semibold focus:outline-none"
                      >
                        <option value="SECOND">sec</option>
                        <option value="MINUTE">min</option>
                        <option value="HOUR">hrs</option>
                        <option value="DAY">days</option>
                        <option value="WEEK">wks</option>
                        <option value="MONTH">mos</option>
                        <option value="YEAR">yrs</option>
                      </select>
                    </div>
                  </div>

                  {/* Step Card Content form */}
                  <div className="p-4 space-y-3">
                    {/* Action Step Name / Title Input */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-muted-foreground uppercase">Action Step Name / Title</label>
                      <input
                        type="text"
                        value={step.title || ''}
                        onChange={(e) => handleStepChange(index, 'title', e.target.value)}
                        placeholder="e.g. Day 1 Welcome Text or Re-engagement Email"
                        className="w-full bg-muted/10 border border-border rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>

                    {step.type === 'EMAIL' && (
                      <>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-muted-foreground uppercase">Email Subject</label>
                          <input
                            type="text"
                            value={step.subject || ''}
                            onChange={(e) => handleStepChange(index, 'subject', e.target.value)}
                            placeholder="Subject Line"
                            className="w-full bg-muted/10 border border-border rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-muted-foreground uppercase">Email Content</label>
                          <textarea
                            value={step.content}
                            onChange={(e) => handleStepChange(index, 'content', e.target.value)}
                            placeholder="Type email body text..."
                            rows={3}
                            className="w-full bg-muted/10 border border-border rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                          />
                        </div>
                      </>
                    )}

                    {step.type === 'SMS' && (
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-muted-foreground uppercase">Text Content</label>
                        <textarea
                          value={step.content}
                          onChange={(e) => handleStepChange(index, 'content', e.target.value)}
                          placeholder="Type text message..."
                          rows={2}
                          className="w-full bg-muted/10 border border-border rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                        />
                      </div>
                    )}

                    {(step.type === 'CALL' || step.type === 'TASK') && (
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-muted-foreground uppercase">Task Action Details</label>
                        <input
                          type="text"
                          value={step.content}
                          onChange={(e) => handleStepChange(index, 'content', e.target.value)}
                          placeholder={step.type === 'CALL' ? 'Call lead to verify CMA receipt...' : 'Assign standard disclosure review task...'}
                          className="w-full bg-muted/10 border border-border rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-muted-foreground uppercase">Assigned To (Stakeholder Target)</label>
                      <select
                        value={step.assignee || 'AGENT'}
                        onChange={(e) => handleStepChange(index, 'assignee', e.target.value)}
                        className="w-full bg-muted/10 border border-border rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                      >
                        <option value="AGENT">Agent (Internal CRM User)</option>
                        <option value="CLIENT">Client (Lead / Contact)</option>
                        <option value="BOTH">Both (Agent Task & Client Notification)</option>
                      </select>
                    </div>
                  </div>

                  {/* Absolute delete button */}
                  <button
                    onClick={() => handleDeleteStep(index)}
                    className="absolute top-2.5 right-36 md:right-32 text-xs text-red-400 hover:text-red-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    Delete Step
                  </button>
                </div>

                {/* Vertical connector line (except last element) */}
                <div className="w-0.5 h-8 bg-border"></div>

              </div>
            ))}

            {/* Empty checklist view */}
            {steps.length === 0 && (
              <div className="text-center py-10 border border-dashed border-border rounded-xl w-full max-w-xl bg-background">
                <span className="text-2xl block mb-2">🤖</span>
                <p className="text-xs text-muted-foreground italic mb-3">No action steps set up for this campaign workflow.</p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => handleAddStep('EMAIL')}
                    className="px-3 py-1 bg-primary text-primary-foreground font-bold rounded hover:bg-primary/95 text-[10px] uppercase shadow-sm cursor-pointer"
                  >
                    + Email Step
                  </button>
                  <button
                    onClick={() => handleAddStep('SMS')}
                    className="px-3 py-1 bg-secondary text-secondary-foreground font-bold rounded hover:bg-secondary/95 text-[10px] uppercase shadow-sm cursor-pointer"
                  >
                    + SMS Step
                  </button>
                </div>
              </div>
            )}

            {/* Button options to append step at bottom */}
            {steps.length > 0 && (
              <div className="flex gap-2 border border-border bg-background p-2 rounded-xl shadow-sm mb-6">
                <button
                  onClick={() => handleAddStep('EMAIL')}
                  className="px-3 py-1 bg-muted hover:bg-muted/80 border border-border rounded text-[10px] font-bold uppercase cursor-pointer"
                >
                  + Email Step
                </button>
                <button
                  onClick={() => handleAddStep('SMS')}
                  className="px-3 py-1 bg-muted hover:bg-muted/80 border border-border rounded text-[10px] font-bold uppercase cursor-pointer"
                >
                  + SMS Step
                </button>
                <button
                  onClick={() => handleAddStep('CALL')}
                  className="px-3 py-1 bg-muted hover:bg-muted/80 border border-border rounded text-[10px] font-bold uppercase cursor-pointer"
                >
                  + Call Task
                </button>
                <button
                  onClick={() => handleAddStep('TASK')}
                  className="px-3 py-1 bg-muted hover:bg-muted/80 border border-border rounded text-[10px] font-bold uppercase cursor-pointer"
                >
                  + General Task
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Footer controls */}
        <div className="border-t border-border px-6 py-4 bg-muted/10 flex items-center justify-between shrink-0">
          <span className="text-xs font-semibold text-muted-foreground">
            {steps.length} Steps configured
          </span>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border hover:bg-muted rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Saving Campaign...' : 'Save Drip Campaign'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

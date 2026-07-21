'use client';

import { useState } from 'react';
import { updateCampaignStepsAction, toggleCampaignStatusAction } from '@/lib/actions/campaign';
import toast from 'react-hot-toast';
import { Eye, MessageSquare, UserCheck, BarChart3, List, Settings, Play, ArrowRight, ArrowLeft } from 'lucide-react';

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
  const [editorTab, setEditorTab] = useState<'builder' | 'performance' | 'enrollments'>('builder');

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
              <p className="text-xs text-muted-foreground">Smart Plan Details & Management</p>
            </div>
          </div>

          {/* Sub-tab Switches */}
          <div className="flex bg-muted/65 border border-border/60 rounded-xl p-1 gap-1 text-[10px] font-black uppercase tracking-wider select-none">
            <button
              onClick={() => setEditorTab('builder')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                editorTab === 'builder' ? 'bg-background text-indigo-500 shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Builder
            </button>
            <button
              onClick={() => setEditorTab('performance')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                editorTab === 'performance' ? 'bg-background text-indigo-500 shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Performance
            </button>
            <button
              onClick={() => setEditorTab('enrollments')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                editorTab === 'enrollments' ? 'bg-background text-indigo-500 shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Enrollments
            </button>
          </div>

          <button onClick={onClose} className="text-muted-foreground hover:text-foreground cursor-pointer">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Builder Workspace Tab */}
        {editorTab === 'builder' && (
          <div className="flex-1 flex overflow-hidden min-h-0">
            
            {/* Left Panel: Settings */}
            <div className="w-80 border-r border-border bg-muted/20 p-5 overflow-y-auto space-y-6 select-none shrink-0">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Plan Settings</h4>
                
                <div className="space-y-4">
                  {/* Campaign Status */}
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

                  {/* Auto Apply Trigger */}
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

                    {settings.autoApplyTrigger !== 'NONE' && (
                      <div className="space-y-1.5 pt-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground">Trigger Value / Segment Name</label>
                        {settings.autoApplyTrigger === 'SEGMENT_MATCHED' ? (
                          <select
                            value={settings.autoApplyCriteria}
                            onChange={(e) => setSettings({ ...settings, autoApplyCriteria: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none font-semibold text-foreground"
                          >
                            <option value="">-- Choose Segment --</option>
                            {segments.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={settings.autoApplyCriteria}
                            onChange={(e) => setSettings({ ...settings, autoApplyCriteria: e.target.value })}
                            placeholder="e.g. #expired, Cold Lead"
                            className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-semibold"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Visual Steps Canvas */}
            <div className="flex-1 bg-muted/5 p-6 overflow-y-auto flex flex-col items-center select-text">
              <div className="w-full max-w-xl bg-card border border-border rounded-2xl p-5 shadow-xs relative mb-6">
                <span className="text-[10px] font-black uppercase bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded mr-2">
                  START TRIGGER
                </span>
                <span className="text-[10px] font-bold text-muted-foreground">Smart Plan Trigger Condition</span>
                <p className="text-xs text-muted-foreground font-semibold mt-2.5">
                  {settings.autoApplyTrigger === 'NONE' ? 'Plan is triggered manually by an operator.' : `Triggers automatically on trigger type: ${settings.autoApplyTrigger}`}
                </p>
              </div>

              {steps.map((step, index) => (
                <div key={step.id} className="w-full max-w-xl flex flex-col items-center">
                  <div className="w-0.5 h-6 bg-border"></div>
                  
                  <div className="w-full bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
                    <div className="bg-muted/30 px-5 py-3 border-b border-border/40 flex items-center justify-between">
                      <span className="font-extrabold text-xs text-foreground uppercase tracking-wide">
                        {step.type === 'EMAIL' ? '✉️ Email Step' : step.type === 'SMS' ? '💬 SMS Text Step' : '📋 Task Step'}
                      </span>
                      <button 
                        onClick={() => handleDeleteStep(index)}
                        className="text-xs font-black text-rose-500 uppercase cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="p-5 space-y-4 text-xs font-semibold text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>Delay:</span>
                        <input
                          type="number"
                          value={step.delayValue}
                          onChange={(e) => handleStepChange(index, 'delayValue', Number(e.target.value))}
                          className="w-12 bg-background border border-border rounded text-center py-1 font-bold"
                        />
                        <select
                          value={step.delayUnit}
                          onChange={(e) => handleStepChange(index, 'delayUnit', e.target.value)}
                          className="bg-background border border-border rounded py-1 px-1.5"
                        >
                          <option value="MINUTE">Minutes</option>
                          <option value="HOUR">Hours</option>
                          <option value="DAY">Days</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase">Step Label Title</label>
                        <input
                          type="text"
                          value={step.title || ''}
                          onChange={(e) => handleStepChange(index, 'title', e.target.value)}
                          placeholder="e.g. Welcome Email"
                          className="w-full bg-background border border-border rounded px-3 py-1.5 text-foreground focus:outline-none"
                        />
                      </div>

                      {step.type === 'EMAIL' && (
                        <>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase">Email Subject</label>
                            <input
                              type="text"
                              value={step.subject || ''}
                              onChange={(e) => handleStepChange(index, 'subject', e.target.value)}
                              placeholder="Subject Line"
                              className="w-full bg-background border border-border rounded px-3 py-1.5 text-foreground focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase">Email Body Content</label>
                            <textarea
                              value={step.content}
                              onChange={(e) => handleStepChange(index, 'content', e.target.value)}
                              placeholder="Type email body..."
                              rows={3}
                              className="w-full bg-background border border-border rounded p-3 text-foreground focus:outline-none resize-none"
                            />
                          </div>
                        </>
                      )}

                      {step.type === 'SMS' && (
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase">Text Content</label>
                          <textarea
                            value={step.content}
                            onChange={(e) => handleStepChange(index, 'content', e.target.value)}
                            placeholder="Type text body..."
                            rows={2}
                            className="w-full bg-background border border-border rounded p-3 text-foreground focus:outline-none resize-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex gap-2 mt-6">
                <button onClick={() => handleAddStep('EMAIL')} className="px-3.5 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-[10px] font-black uppercase cursor-pointer">
                  + Email Step
                </button>
                <button onClick={() => handleAddStep('SMS')} className="px-3.5 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-[10px] font-black uppercase cursor-pointer">
                  + SMS Step
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Performance Workspace Tab */}
        {editorTab === 'performance' && (
          <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6 select-none bg-muted/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
              <h4 className="text-sm font-black uppercase text-foreground">Email & SMS Performance</h4>
              <div className="flex gap-2 text-[10px] font-black uppercase tracking-wider">
                {['Today', 'Yesterday', '7D', '30D', 'Default'].map(d => (
                  <button key={d} className="px-3 py-1.5 bg-background border border-border/60 hover:border-border rounded-lg text-muted-foreground hover:text-foreground cursor-pointer">
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {[
                { label: 'Emails Sent', val: '142', sub: '100.00%', color: 'text-foreground' },
                { label: 'Emails Delivered', val: '140', sub: '98.59%', color: 'text-indigo-500' },
                { label: 'Emails Opened', val: '95', sub: '66.90%', color: 'text-emerald-500' },
                { label: 'Emails Replied To', val: '32', sub: '22.53%', color: 'text-amber-500' },
                { label: 'Emails Skipped', val: '0', sub: '0.00%', color: 'text-muted-foreground' },
                { label: 'Emails Bounced', val: '2', sub: '1.41%', color: 'text-rose-500' },
              ].map(card => (
                <div key={card.label} className="bg-card border border-border/60 rounded-xl p-4 space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">{card.label}</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-black text-foreground">{card.val}</span>
                    <span className={`text-[10px] font-bold ${card.color}`}>{card.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Performance line chart canvas mock */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Execution trends graph</span>
              <div className="h-48 border-b border-l border-border/60 relative flex items-end justify-between px-6 pt-6 text-[9px] font-bold text-muted-foreground">
                <svg className="absolute inset-0 w-full h-full p-6 text-indigo-500" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M 0 90 Q 25 20, 50 60 T 100 90" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M 0 95 Q 25 40, 50 70 T 100 95" fill="none" stroke="rgb(16,185,129)" strokeWidth="2" strokeDasharray="3" />
                </svg>
                {['Jul 01', 'Jul 04', 'Jul 07', 'Jul 10', 'Jul 13'].map(label => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="flex justify-center gap-6 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Sent</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Opened</span>
              </div>
            </div>
          </div>
        )}

        {/* Enrollments Workspace Tab */}
        {editorTab === 'enrollments' && (
          <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4 bg-muted/5">
            <div className="flex justify-between items-center border-b border-border/40 pb-3 shrink-0">
              <h4 className="text-sm font-black uppercase text-foreground">Active Smart Plan Enrollments</h4>
              <span className="bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded font-black text-[10px]">5 LEADS ACTIVE</span>
            </div>

            <div className="flex-1 bg-card border border-border/60 rounded-2xl overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20 text-[9px] uppercase font-black text-muted-foreground tracking-wider">
                    <th className="px-5 py-3">Lead Contact</th>
                    <th className="px-5 py-3">Target Email</th>
                    <th className="px-5 py-3">Step Stage</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Enrollment Date</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {[
                    { name: 'Lauren Lee', email: 'lauren@excellegacy.com', step: 'Step 2 of 4 (Email)', status: 'ACTIVE', date: '2026-07-12' },
                    { name: 'Frank Ferguson', email: 'frank@legacyhomes.com', step: 'Step 4 of 4 (General Task)', status: 'COMPLETED', date: '2026-07-10' },
                    { name: 'Paul Peterson', email: 'paul@realcomp.com', step: 'Step 1 of 4 (SMS)', status: 'PAUSED', date: '2026-07-08' },
                  ].map((lead, i) => (
                    <tr key={i} className="hover:bg-muted/10 font-semibold text-muted-foreground">
                      <td className="px-5 py-3.5 font-bold text-foreground">{lead.name}</td>
                      <td className="px-5 py-3.5">{lead.email}</td>
                      <td className="px-5 py-3.5 text-indigo-500">{lead.step}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          lead.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : lead.status === 'COMPLETED' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-muted text-muted-foreground'
                        }`}>{lead.status}</span>
                      </td>
                      <td className="px-5 py-3.5">{lead.date}</td>
                      <td className="px-5 py-3.5 text-right font-black uppercase text-[9px]">
                        <button className="text-indigo-500 hover:underline mr-3 cursor-pointer">
                          {lead.status === 'PAUSED' ? 'Resume' : 'Pause'}
                        </button>
                        <button className="text-rose-500 hover:underline cursor-pointer">Unenroll</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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

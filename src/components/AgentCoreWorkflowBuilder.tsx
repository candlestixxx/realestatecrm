'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface TriggerCondition {
  field: string;
  operator: 'contains' | 'equals' | 'not_contains' | 'exists';
  value?: string;
}

interface WorkflowAction {
  type: 'update_lead_status' | 'create_task' | 'add_activity' | 'notify';
  status?: string;
  title?: string;
  priority?: string;
  note?: string;
  email?: string;
  subject?: string;
  body?: string;
}

interface AgentWorkflow {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  actions: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const TRIGGER_EVENTS = [
  { value: 'communication_received', label: 'Communication Received' },
  { value: 'lead_created', label: 'Lead Created' },
  { value: 'lead_updated', label: 'Lead Updated' },
  { value: 'contact_created', label: 'Contact Created' },
  { value: 'task_completed', label: 'Task Completed' },
  { value: 'deal_stage_changed', label: 'Deal Stage Changed' },
];

const ACTION_TYPES = [
  { value: 'update_lead_status', label: 'Update Lead Status' },
  { value: 'create_task', label: 'Create Task' },
  { value: 'add_activity', label: 'Add Activity Note' },
  { value: 'notify', label: 'Send Notification' },
];

const LEAD_STATUSES = ['NEW', 'ACTIVE', 'HOT', 'COLD', 'CLOSED_WON', 'CLOSED_LOST'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const OPERATORS = ['contains', 'equals', 'not_contains', 'exists'];

function emptyAction(): WorkflowAction { return { type: 'create_task', title: '' }; }

function parseActions(json: string): { condition: TriggerCondition | null; actions: WorkflowAction[] } {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return { condition: null, actions: parsed };
    return { condition: parsed.condition ?? null, actions: parsed.actions ?? [] };
  } catch {
    return { condition: null, actions: [] };
  }
}

export default function AgentCoreWorkflowBuilder() {
  const [workflows, setWorkflows] = useState<AgentWorkflow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState('lead_created');
  const [conditionEnabled, setConditionEnabled] = useState(false);
  const [condition, setCondition] = useState<TriggerCondition>({ field: '', operator: 'contains', value: '' });
  const [actions, setActions] = useState<WorkflowAction[]>([emptyAction()]);
  const [isActive, setIsActive] = useState(true);

  const loadWorkflows = useCallback(async () => {
    try {
      const res = await fetch('/api/agentcore/workflows');
      const data = await res.json();
      setWorkflows(data.workflows || []);
    } catch {
      toast.error('Failed to load workflows');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadWorkflows(); }, [loadWorkflows]);

  const resetForm = () => {
    setName(''); setDescription(''); setTrigger('lead_created');
    setConditionEnabled(false); setCondition({ field: '', operator: 'contains', value: '' });
    setActions([emptyAction()]); setIsActive(true); setEditingId(null); setShowForm(false);
  };

  const startEdit = (wf: AgentWorkflow) => {
    const parsed = parseActions(wf.actions);
    setName(wf.name); setDescription(wf.description || ''); setTrigger(wf.trigger);
    setConditionEnabled(!!parsed.condition);
    setCondition(parsed.condition || { field: '', operator: 'contains', value: '' });
    setActions(parsed.actions.length ? parsed.actions : [emptyAction()]);
    setIsActive(wf.isActive); setEditingId(wf.id); setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Workflow name is required'); return; }

    const actionsPayload = conditionEnabled && condition.field
      ? { condition, actions }
      : { actions };

    const payload = {
      name, description, trigger,
      actions: JSON.stringify(actionsPayload),
      isActive,
    };

    try {
      const url = editingId ? `/api/agentcore/workflows/${editingId}` : '/api/agentcore/workflows';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Save failed');
      toast.success(editingId ? 'Workflow updated' : 'Workflow created');
      resetForm();
      loadWorkflows();
    } catch {
      toast.error('Failed to save workflow');
    }
  };

  const toggleActive = async (wf: AgentWorkflow) => {
    try {
      await fetch(`/api/agentcore/workflows/${wf.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !wf.isActive }),
      });
      loadWorkflows();
    } catch {
      toast.error('Failed to toggle workflow');
    }
  };

  const deleteWorkflow = async (id: string) => {
    if (!confirm('Delete this workflow?')) return;
    try {
      await fetch(`/api/agentcore/workflows/${id}`, { method: 'DELETE' });
      toast.success('Workflow deleted');
      loadWorkflows();
    } catch {
      toast.error('Failed to delete workflow');
    }
  };

  const updateAction = (index: number, patch: Partial<WorkflowAction>) => {
    setActions(prev => prev.map((a, i) => i === index ? { ...a, ...patch } : a));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Workflow Automations</h2>
          <p className="text-xs text-muted-foreground">If-this-then-that rules for your CRM</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-bold rounded-lg hover:bg-secondary/90 transition-colors"
        >
          + New Workflow
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-base font-bold text-foreground">{editingId ? 'Edit Workflow' : 'Create Workflow'}</h3>
              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Name & Description */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required
                    className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/50 text-foreground" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Description</label>
                  <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/50 text-foreground" />
                </div>
              </div>

              {/* Trigger */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">When this happens...</label>
                <select value={trigger} onChange={e => setTrigger(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/50 text-foreground">
                  {TRIGGER_EVENTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {/* Condition */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer">
                  <input type="checkbox" checked={conditionEnabled} onChange={e => setConditionEnabled(e.target.checked)} className="rounded border-border" />
                  Only if condition matches
                </label>
                {conditionEnabled && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <input type="text" placeholder="Field name" value={condition.field} onChange={e => setCondition({ ...condition, field: e.target.value })}
                      className="px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg text-foreground" />
                    <select value={condition.operator} onChange={e => setCondition({ ...condition, operator: e.target.value as TriggerCondition['operator'] })}
                      className="px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg text-foreground">
                      {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                    <input type="text" placeholder="Value" value={condition.value || ''} onChange={e => setCondition({ ...condition, value: e.target.value })}
                      className="px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg text-foreground" />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">...then do this</label>
                  <button type="button" onClick={() => setActions([...actions, emptyAction()])}
                    className="text-xs text-secondary hover:underline font-bold">+ Add Action</button>
                </div>
                <div className="space-y-3">
                  {actions.length === 0 ? <p className="text-xs text-gray-400 py-2">No actions configured.</p> : actions.map((action, idx) => (
                    <div key={idx} className="p-3 bg-muted/30 border border-border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <select value={action.type} onChange={e => updateAction(idx, { type: e.target.value as WorkflowAction['type'] })}
                          className="px-2 py-1.5 text-xs bg-background border border-border rounded text-foreground font-bold">
                          {ACTION_TYPES.map(at => <option key={at.value} value={at.value}>{at.label}</option>)}
                        </select>
                        {actions.length > 1 && (
                          <button type="button" onClick={() => setActions(actions.filter((_, i) => i !== idx))}
                            className="text-xs text-red-500 hover:underline">Remove</button>
                        )}
                      </div>

                      {action.type === 'update_lead_status' && (
                        <select value={action.status || ''} onChange={e => updateAction(idx, { status: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs bg-background border border-border rounded text-foreground">
                          <option value="">Select status...</option>
                          {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      )}
                      {action.type === 'create_task' && (
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" placeholder="Task title" value={action.title || ''} onChange={e => updateAction(idx, { title: e.target.value })}
                            className="px-2 py-1.5 text-xs bg-background border border-border rounded text-foreground" />
                          <select value={action.priority || 'MEDIUM'} onChange={e => updateAction(idx, { priority: e.target.value })}
                            className="px-2 py-1.5 text-xs bg-background border border-border rounded text-foreground">
                            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                      )}
                      {action.type === 'add_activity' && (
                        <input type="text" placeholder="Activity note" value={action.note || ''} onChange={e => updateAction(idx, { note: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs bg-background border border-border rounded text-foreground" />
                      )}
                      {action.type === 'notify' && (
                        <div className="grid grid-cols-2 gap-2">
                          <input type="email" placeholder="Email (optional)" value={action.email || ''} onChange={e => updateAction(idx, { email: e.target.value })}
                            className="px-2 py-1.5 text-xs bg-background border border-border rounded text-foreground" />
                          <input type="text" placeholder="Subject" value={action.subject || ''} onChange={e => updateAction(idx, { subject: e.target.value })}
                            className="px-2 py-1.5 text-xs bg-background border border-border rounded text-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded border-border" />
                Active (enable this workflow)
              </label>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={resetForm}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2 bg-secondary text-secondary-foreground text-sm font-bold rounded-lg hover:bg-secondary/90 transition-colors">
                  {editingId ? 'Update Workflow' : 'Create Workflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Workflow List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading workflows...</div>
      ) : workflows.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 border border-border rounded-xl">
          <div className="text-3xl mb-2">⚡</div>
          <p className="text-sm text-muted-foreground">No workflows yet. Create your first automation.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {workflows.length === 0 ? <div className="text-center py-8 text-muted-foreground text-sm">No workflows yet. Create one above.</div> : workflows.map(wf => {
            const parsed = parseActions(wf.actions);
            const triggerLabel = TRIGGER_EVENTS.find(t => t.value === wf.trigger)?.label || wf.trigger;
            return (
              <div key={wf.id} className={`flex items-center justify-between p-4 bg-background border rounded-xl transition-opacity ${wf.isActive ? 'border-border' : 'border-border/50 opacity-60'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">{wf.name}</h3>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${wf.isActive ? 'bg-green-500/15 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                      {wf.isActive ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  {wf.description && <p className="text-xs text-muted-foreground mt-0.5">{wf.description}</p>}
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                    <span className="px-1.5 py-0.5 bg-muted rounded font-bold">{triggerLabel}</span>
                    <span>→</span>
                    <span>{parsed.actions.length} action{parsed.actions.length !== 1 ? 's' : ''}</span>
                    {parsed.condition && <span className="px-1.5 py-0.5 bg-orange-500/15 text-orange-500 rounded font-bold">conditional</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(wf)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-border">
                    {wf.isActive ? 'Pause' : 'Resume'}
                  </button>
                  <button onClick={() => startEdit(wf)} className="text-xs text-secondary hover:underline px-2 py-1">
                    Edit
                  </button>
                  <button onClick={() => deleteWorkflow(wf.id)} className="text-xs text-red-500 hover:underline px-2 py-1">
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * AgentCore Workflow Engine
 *
 * Conditional "if this, then that" automation for the CRM.
 * (Ported from aicrm, renamed from HyperNexus to AgentCore)
 */

import prisma from '@/lib/prisma';

export type TriggerEvent = 'communication_received' | 'lead_created' | 'lead_updated' | 'contact_created' | 'task_completed' | 'deal_stage_changed';

export interface TriggerCondition {
  field: string;
  operator: 'contains' | 'equals' | 'not_contains' | 'exists';
  value?: string;
}

export interface WorkflowAction {
  type: 'update_lead_status' | 'create_task' | 'add_activity' | 'notify';
  status?: string;
  title?: string;
  priority?: string;
  note?: string;
  email?: string;
  body?: string;
  subject?: string;
}

export interface WorkflowEventPayload {
  event: TriggerEvent;
  workspaceId: string;
  userId: string;
  contactId?: string;
  leadId?: string;
  data?: Record<string, unknown>;
}

function evaluateCondition(condition: TriggerCondition | null, payload: WorkflowEventPayload): boolean {
  if (!condition) return true;
  const value = payload.data?.[condition.field] ?? '';
  switch (condition.operator) {
    case 'contains': return String(value).toLowerCase().includes((condition.value ?? '').toLowerCase());
    case 'not_contains': return !String(value).toLowerCase().includes((condition.value ?? '').toLowerCase());
    case 'equals': return String(value).toLowerCase() === (condition.value ?? '').toLowerCase();
    case 'exists': return value !== undefined && value !== null && value !== '';
    default: return true;
  }
}

async function executeAction(action: WorkflowAction, payload: WorkflowEventPayload): Promise<string> {
  switch (action.type) {
    case 'update_lead_status': {
      if (!payload.leadId || !action.status) return 'skipped: missing leadId or status';
      await prisma.lead.update({ where: { id: payload.leadId }, data: { status: action.status as 'NEW' | 'ACTIVE' | 'HOT' | 'COLD' | 'CLOSED_WON' | 'CLOSED_LOST' } });
      return `lead ${payload.leadId} -> ${action.status}`;
    }
    case 'create_task': {
      if (!action.title) return 'skipped: missing title';
      await prisma.task.create({ data: { workspaceId: payload.workspaceId, userId: payload.userId, title: action.title, priority: (action.priority as 'LOW' | 'MEDIUM' | 'HIGH') || 'MEDIUM' } });
      return `task created: ${action.title}`;
    }
    case 'add_activity': {
      if (!action.note) return 'skipped: missing note';
      await prisma.activity.create({ data: { type: 'NOTE', description: action.note, userId: payload.userId, ...(payload.leadId && { leadId: payload.leadId }) } });
      return 'activity logged';
    }
    case 'notify': {
      return `notification queued${action.email ? ` for ${action.email}` : ''}`;
    }
    default:
      return `unknown action: ${(action as { type: string }).type}`;
  }
}

export async function triggerWorkflows(payload: WorkflowEventPayload): Promise<{ triggered: number; results: string[] }> {
  const workflows = await prisma.agentWorkflow.findMany({
    where: { workspaceId: payload.workspaceId, isActive: true, trigger: payload.event },
  });

  const results: string[] = [];
  let triggered = 0;

  for (const workflow of workflows) {
    // Parse actions JSON which may contain { condition, actions } or just actions array
    let parsed: { condition?: TriggerCondition; actions?: WorkflowAction[] } | WorkflowAction[] = [];
    try { parsed = JSON.parse(workflow.actions); } catch { continue; }

    let condition: TriggerCondition | null = null;
    let actions: WorkflowAction[] = [];

    if (Array.isArray(parsed)) {
      actions = parsed;
    } else {
      condition = parsed.condition ?? null;
      actions = parsed.actions ?? [];
    }

    if (!evaluateCondition(condition, payload)) continue;

    const actionResults: string[] = [];
    for (const action of actions) {
      try { actionResults.push(await executeAction(action, payload)); }
      catch (err) { actionResults.push(`error: ${err instanceof Error ? err.message : 'unknown'}`); }
    }

    triggered++;
    results.push(`[${workflow.name}] ${actionResults.join('; ')}`);
  }

  return { triggered, results };
}

export const TRIGGER_EVENTS: { value: TriggerEvent; label: string; description: string }[] = [
  { value: 'communication_received', label: 'Communication Received', description: 'Fires when a contact replies or communication comes in' },
  { value: 'lead_created', label: 'Lead Created', description: 'Fires when a new lead is added' },
  { value: 'lead_updated', label: 'Lead Updated', description: 'Fires when a lead status changes' },
  { value: 'contact_created', label: 'Contact Created', description: 'Fires when a contact is added' },
  { value: 'task_completed', label: 'Task Completed', description: 'Fires when a task is marked complete' },
  { value: 'deal_stage_changed', label: 'Deal Stage Changed', description: 'Fires when a deal moves to a new stage' },
];

/**
 * AgentCore NL Command Engine
 *
 * Translates natural-language commands into executable CRM actions.
 * Rule-based intent detection with optional LLM interpretation.
 * (Ported from aicrm, renamed from HyperNexus to AgentCore)
 */

import prisma from '@/lib/prisma';
import { createProviderClient } from '@/lib/ai/llm-providers';

async function callLLM(prompt: string, system?: string): Promise<string | null> {
  try {
    const apiKeyRecord = await prisma.apiKey.findFirst({ where: { provider: 'openai' } });
    if (!apiKeyRecord) return null;
    const { decrypt } = await import('@/lib/encryption');
    const key = decrypt(apiKeyRecord.key);
    const client = createProviderClient('openai', 'gpt-4o-mini', key);
    const result = await client.complete({ prompt, system });
    return result.text;
  } catch {
    return null;
  }
}

export interface AgentCoreContext {
  workspaceId: string;
  userId: string;
}

export interface AgentCoreResult {
  success: boolean;
  intent?: string;
  action?: string;
  message: string;
  data?: unknown;
  usedLLM?: boolean;
}

type ActionExecutor = (ctx: AgentCoreContext, params: Record<string, string>) => Promise<AgentCoreResult>;

interface IntentRule {
  intent: string;
  patterns: RegExp[];
  execute: ActionExecutor;
}

const updateLeadStage: ActionExecutor = async (ctx, params) => {
  const statusMap: Record<string, string> = {
    new: 'NEW', active: 'ACTIVE', hot: 'HOT', cold: 'COLD',
    'closed won': 'CLOSED_WON', won: 'CLOSED_WON', 'closed lost': 'CLOSED_LOST', lost: 'CLOSED_LOST', contacted: 'ACTIVE',
  };
  const rawStatus = params['stage'] || params['status'] || '';
  const status = statusMap[rawStatus.toLowerCase()];
  if (!status) return { success: false, message: `Unknown lead status: "${rawStatus}"` };

  const leadRef = params['lead'];
  if (!leadRef) return { success: false, message: 'Specify which lead (e.g., "update lead John to hot")' };

  const lead = await prisma.lead.findFirst({
    where: {
      workspaceId: ctx.workspaceId,
      OR: [
        { id: leadRef },
        { contact: { firstName: { contains: leadRef } } },
        { contact: { lastName: { contains: leadRef } } },
      ],
    },
    include: { contact: { select: { firstName: true, lastName: true } } },
  });
  if (!lead) return { success: false, message: `Lead "${leadRef}" not found` };

  await prisma.lead.update({ where: { id: lead.id }, data: { status } });
  await prisma.activity.create({ data: { leadId: lead.id, workspaceId: ctx.workspaceId, type: 'NOTE', content: `AgentCore: status updated to "${status}"`, userId: ctx.userId } });

  const leadName = `${lead.contact.firstName} ${lead.contact.lastName || ''}`.trim();
  return { success: true, message: `Lead "${leadName}" updated to "${status}"` };
};

const createTask: ActionExecutor = async (ctx, params) => {
  const title = params['title'] || params['task'];
  if (!title) return { success: false, message: 'Specify the task title' };
  const task = await prisma.task.create({
    data: { workspaceId: ctx.workspaceId, assignedToId: ctx.userId, title, description: params['description'] || null, dueDate: params['when'] ? new Date(params['when']) : null },
  });
  return { success: true, message: `Task "${title}" created`, data: task };
};

const listContacts: ActionExecutor = async (ctx) => {
  const contacts = await prisma.contact.findMany({
    where: { workspaceId: ctx.workspaceId }, orderBy: { updatedAt: 'desc' }, take: 20,
    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
  });
  return { success: true, message: `Found ${contacts.length} recent contacts`, data: contacts };
};

const summarizeWorkspace: ActionExecutor = async (ctx) => {
  const [contactCount, leadCount, hotLeads, taskCount, dealCount] = await Promise.all([
    prisma.contact.count({ where: { workspaceId: ctx.workspaceId } }),
    prisma.lead.count({ where: { workspaceId: ctx.workspaceId } }),
    prisma.lead.count({ where: { workspaceId: ctx.workspaceId, status: 'HOT' } }),
    prisma.task.count({ where: { workspaceId: ctx.workspaceId, status: { not: 'DONE' } } }),
    prisma.deal.count({ where: { workspaceId: ctx.workspaceId } }),
  ]);
  return { success: true, message: `Your workspace has ${contactCount} contacts, ${leadCount} leads (${hotLeads} hot), ${dealCount} deals, and ${taskCount} pending tasks.`, data: { contactCount, leadCount, hotLeads, taskCount, dealCount } };
};

const listTasks: ActionExecutor = async (ctx, params) => {
  const where: Record<string, unknown> = { workspaceId: ctx.workspaceId };
  if (params['status'] === 'pending') where.status = { not: 'DONE' };
  if (params['status'] === 'completed') where.status = 'DONE';
  const tasks = await prisma.task.findMany({ where, orderBy: { dueDate: 'asc' }, select: { id: true, title: true, status: true, dueDate: true }, take: 20 });
  return { success: true, message: `Found ${tasks.length} tasks`, data: tasks };
};

const getContact: ActionExecutor = async (ctx, params) => {
  const ref = params['id'] || params['contact'];
  if (!ref) return { success: false, message: 'Specify a contact ID or name' };
  const contact = await prisma.contact.findFirst({
    where: { workspaceId: ctx.workspaceId, OR: [{ id: ref }, { firstName: { contains: ref } }, { lastName: { contains: ref } }] },
    include: { leads: { take: 5 }, Activity: { orderBy: { createdAt: 'desc' }, take: 5 } },
  });
  if (!contact) return { success: false, message: `Contact "${ref}" not found` };
  return { success: true, message: `${contact.firstName} ${contact.lastName}`, data: contact };
};

const negotiate: ActionExecutor = async (ctx, params) => {
  const topic = params['topic'] || params['about'] || 'this offer';
  const advice = await callLLM(`Act as an expert real estate negotiation advisor. Give concrete, actionable advice on: ${topic}. Keep it under 200 words.`, 'You are an expert real estate negotiation advisor.');
  if (!advice) return { success: false, message: 'No AI key configured. Add one in Settings -> AI Models.' };
  await prisma.activity.create({ data: { type: 'NOTE', content: `AgentCore negotiation advice: ${advice}`, userId: ctx.userId, workspaceId: ctx.workspaceId } });
  return { success: true, message: advice };
};

const draftContent: ActionExecutor = async (_ctx, params) => {
  const kind = params['kind'] || params['channel'] || 'email';
  const topic = params['topic'] || params['about'] || 'follow up';
  const draft = await callLLM(`Draft a professional ${kind} for a real estate client about: ${topic}. Keep it concise and warm.`);
  if (!draft) return { success: false, message: 'No AI key configured. Add one in Settings -> AI Models.' };
  return { success: true, message: draft };
};

export const INTENT_RULES: IntentRule[] = [
  { intent: 'update_lead_stage', patterns: [
    /update\s+(?:lead\s+)?(\S+)\s+to\s+(hot|cold|active|new|closed won|closed lost|won|lost|contacted)/i,
    /set\s+(?:lead\s+)?(\S+)\s+(?:stage|status)\s+to\s+(hot|cold|active|new|closed won|closed lost|won|lost|contacted)/i,
    /mark\s+(?:lead\s+)?(\S+)\s+as\s+(hot|cold|active|new|closed won|closed lost|won|lost|contacted)/i,
  ], execute: updateLeadStage },
  { intent: 'create_task', patterns: [
    /(?:create|add|schedule)\s+(?:a\s+)?task\s+(?:to\s+)?(.+?)(?:\s+(?:for|due|when|at)\s+(.+))?$/i,
    /remind\s+me\s+to\s+(.+)/i,
  ], execute: createTask },
  { intent: 'list_contacts', patterns: [ /(?:list|show|get|display)\s+(?:all\s+)?(?:my\s+)?contacts/i, /who\s+are\s+my\s+(?:recent\s+)?contacts/i ], execute: listContacts },
  { intent: 'summarize_workspace', patterns: [ /(?:summarize|summary|overview|dashboard|stats|status)\s+(?:of\s+)?(?:my\s+)?(?:workspace|business|crm|pipeline|account)/i ], execute: summarizeWorkspace },
  { intent: 'list_tasks', patterns: [ /(?:list|show|get|display)\s+(?:all\s+)?(?:my\s+)?tasks/i, /what\s+are\s+my\s+(?:pending\s+)?tasks/i ], execute: listTasks },
  { intent: 'get_contact', patterns: [ /(?:get|show|display)\s+(?:contact\s+)?(\S+)\s+(?:details|info|profile)?/i, /lookup\s+(?:contact\s+)?(\S+)/i ], execute: getContact },
  { intent: 'negotiate', patterns: [ /(?:advise|negotiate|should\s+i\s+counter|what\s+should\s+i\s+offer)(?:\s+on)?\s+(.+)/i, /negotiation\s+(?:advice|advisor)\s+(?:for|on)\s+(.+)/i ], execute: negotiate },
  { intent: 'draft', patterns: [ /(?:draft|write|compose)\s+(?:an?\s+)?(email|sms|text|message|letter)\s+(?:to\s+\S+\s+)?(?:about|for|saying)\s+(.+)/i ], execute: draftContent },
];

// Maps numbered capture groups to named params per intent
const GROUP_MAP: Record<string, string[]> = {
  update_lead_stage: ['lead', 'stage'],
  create_task: ['title', 'when'],
  get_contact: ['id'],
  negotiate: ['topic'],
  draft: ['kind', 'topic'],
};

export function detectIntent(command: string): { intent: string; params: Record<string, string> } | null {
  for (const rule of INTENT_RULES) {
    for (const pattern of rule.patterns) {
      const match = command.match(pattern);
      if (match) {
        const params: Record<string, string> = {};
        const names = GROUP_MAP[rule.intent] || [];
        for (let i = 1; i < match.length; i++) {
          const value = match[i];
          if (value && names[i - 1]) params[names[i - 1]] = value.trim();
        }
        return { intent: rule.intent, params };
      }
    }
  }
  return null;
}

export async function executeCommand(command: string, ctx: AgentCoreContext, opts: { useLLMFallback?: boolean } = {}): Promise<AgentCoreResult> {
  const detected = detectIntent(command);
  if (detected) {
    const rule = INTENT_RULES.find((r) => r.intent === detected.intent);
    if (rule) {
      const result = await rule.execute(ctx, detected.params);
      return { ...result, intent: rule.intent, action: rule.intent };
    }
  }
  if (opts.useLLMFallback) {
    const completion = await callLLM(command, 'You are interpreting a natural-language CRM command. Respond with ONLY a JSON object: {"intent":"...","message":"..."} describing what action to take.');
    if (completion) return { success: true, intent: 'llm_interpreted', message: completion, usedLLM: true };
  }
  return { success: false, intent: 'unknown', message: 'I did not understand that command. Try:\n- "update lead [name] to hot"\n- "create a task to call John tomorrow"\n- "list contacts"\n- "summarize my workspace"' };
}

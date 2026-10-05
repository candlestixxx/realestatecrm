import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEFAULT_WORKSPACE_SLUG } from '@/lib/workspace-context';

/**
 * AgentCore Mobile Voice Commands
 * Natural language command processing for mobile/voice input.
 * "Text all my Hot leads about the open house" → structured action.
 */
export async function POST(request: NextRequest) {
  let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  const { command, workspaceId, userId } = body;

  if (!command) {
    return NextResponse.json({ error: 'command required' }, { status: 400 });
  }

  const parsed = parseCommand(command);
  const result = await executeCommand(parsed, workspaceId || DEFAULT_WORKSPACE_SLUG, userId);

  return NextResponse.json({
    command,
    parsed,
    result,
    response: result.message,
  });
}

interface ParsedCommand {
  action: string;
  target: string;
  filter: Record<string, string>;
  message: string;
  confidence: number;
}

function parseCommand(command: string): ParsedCommand {
  const lower = command.toLowerCase();
  const confidence = 0.85;

  // Text/SMS commands
  if (lower.includes('text') || lower.includes('sms') || lower.includes('message')) {
    const filter: Record<string, string> = {};
    if (lower.includes('hot')) filter.status = 'HOT';
    if (lower.includes('warm')) filter.status = 'WARM';
    if (lower.includes('cold')) filter.status = 'COLD';
    if (lower.includes('active')) filter.status = 'ACTIVE';
    if (lower.includes('all') || !Object.keys(filter).length) filter.status = 'ALL';

    // Extract message content
    const aboutMatch = lower.match(/about\s+(.+?)(?:\s+to\s|\s*$)/);
    const message = aboutMatch ? aboutMatch[1] : '';

    return { action: 'SEND_SMS', target: 'leads', filter, message, confidence };
  }

  // Email commands
  if (lower.includes('email') || lower.includes('mail')) {
    const filter: Record<string, string> = {};
    if (lower.includes('hot')) filter.status = 'HOT';
    if (lower.includes('all') || !Object.keys(filter).length) filter.status = 'ALL';
    return { action: 'SEND_EMAIL', target: 'leads', filter, message: '', confidence };
  }

  // Call commands
  if (lower.includes('call') || lower.includes('dial') || lower.includes('phone')) {
    return { action: 'START_CALL', target: 'leads', filter: { status: 'HOT' }, message: '', confidence };
  }

  // Search commands
  if (lower.includes('show') || lower.includes('find') || lower.includes('search') || lower.includes('list')) {
    const filter: Record<string, string> = {};
    if (lower.includes('hot')) filter.status = 'HOT';
    if (lower.includes('today')) filter.date = 'today';
    if (lower.includes('listing')) filter.type = 'listing';
    return { action: 'SEARCH', target: 'leads', filter, message: '', confidence };
  }

  // Create commands
  if (lower.includes('create') || lower.includes('add') || lower.includes('new')) {
    if (lower.includes('listing')) return { action: 'CREATE_LISTING', target: 'listing', filter: {}, message: '', confidence };
    if (lower.includes('lead')) return { action: 'CREATE_LEAD', target: 'lead', filter: {}, message: '', confidence };
    if (lower.includes('task') || lower.includes('reminder')) return { action: 'CREATE_TASK', target: 'task', filter: {}, message: '', confidence };
    return { action: 'CREATE', target: 'unknown', filter: {}, message: '', confidence: 0.5 };
  }

  // Report commands
  if (lower.includes('report') || lower.includes('stats') || lower.includes('analytics')) {
    return { action: 'SHOW_REPORT', target: 'dashboard', filter: {}, message: '', confidence };
  }

  return { action: 'UNKNOWN', target: 'unknown', filter: {}, message: command, confidence: 0.3 };
}

async function executeCommand(parsed: ParsedCommand, workspaceId: string, userId?: string) {
  switch (parsed.action) {
    case 'SEND_SMS': {
      const where: any = { workspaceId };
      if (parsed.filter.status && parsed.filter.status !== 'ALL') where.status = parsed.filter.status;

      const leads = await prisma.lead.findMany({
        where,
        include: { contact: { select: { firstName: true, lastName: true, phone: true } } },
        take: 50,
      });
      return {
        action: 'SEND_SMS',
        recipients: leads.length,
        leads: leads.map(l => ({ id: l.id, name: (l.contact?.firstName || '') + ' ' + (l.contact?.lastName || ''), phone: l.contact?.phone })),
        message: 'Ready to send SMS to ' + leads.length + ' leads. Message: ' + (parsed.message || 'your custom message'),
      };
    }

    case 'SEND_EMAIL': {
      const where: any = { workspaceId };
      if (parsed.filter.status && parsed.filter.status !== 'ALL') where.status = parsed.filter.status;
      const leads = await prisma.lead.findMany({ where, take: 50 });
      return {
        action: 'SEND_EMAIL',
        recipients: leads.length,
        message: 'Ready to send email to ' + leads.length + ' leads.',
      };
    }

    case 'SEARCH': {
      const where: any = { workspaceId };
      if (parsed.filter.status && parsed.filter.status !== 'ALL') where.status = parsed.filter.status;
      const results = await prisma.lead.findMany({
        where,
        include: { contact: { select: { firstName: true, lastName: true } } },
        take: 10,
      });
      return {
        action: 'SEARCH',
        results: results.map(l => ({ id: l.id, name: (l.contact?.firstName || '') + ' ' + (l.contact?.lastName || ''), status: l.status })),
        message: 'Found ' + results.length + ' leads.',
      };
    }

    case 'SHOW_REPORT': {
      const [leadCount, dealCount] = await Promise.all([
        prisma.lead.count({ where: { workspaceId } }),
        prisma.deal.count({ where: { workspaceId } }),
      ]);
      return {
        action: 'SHOW_REPORT',
        stats: { leads: leadCount, deals: dealCount },
        message: 'You have ' + leadCount + ' leads and ' + dealCount + ' deals in your pipeline.',
      };
    }

    case 'CREATE_LISTING':
      return { action: 'CREATE_LISTING', message: 'I can help create a listing. Please provide the address and details.', needsInput: true };

    case 'START_CALL':
      return { action: 'START_CALL', message: 'Starting a calling session for Hot leads.', needsConfirmation: true };

    default:
      return { action: parsed.action, message: 'I understood "' + parsed.action + '" but need more details. Try "text my hot leads about the open house" or "show me today\'s leads".' };
  }
}

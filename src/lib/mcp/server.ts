/**
 * AgentCore MCP Server
 *
 * Exposes CRM capabilities as Model Context Protocol (MCP) tools
 * for external AI agents (Claude Desktop, Cursor, etc.).
 * Protocol: JSON-RPC 2.0 over HTTP POST.
 * (Ported from aicrm, renamed from HyperNexus to AgentCore)
 */

import prisma from '@/lib/prisma';

export const MCP_PROTOCOL_VERSION = '2024-11-05';
export const SERVER_NAME = 'agentcore-crm';
export const SERVER_VERSION = '1.0.0';

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPSession {
  workspaceId: string;
  userId: string;
}

export const MCP_TOOLS: MCPToolDefinition[] = [
  { name: 'list_contacts', description: 'List contacts. Supports search and filtering.', inputSchema: { type: 'object', properties: { search: { type: 'string' }, limit: { type: 'integer', default: 25 } } } },
  { name: 'get_contact', description: 'Get full details for a contact by ID.', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'create_contact', description: 'Create a new contact.', inputSchema: { type: 'object', properties: { firstName: { type: 'string' }, lastName: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' } }, required: ['firstName', 'lastName'] } },
  { name: 'update_lead_status', description: 'Update a lead status.', inputSchema: { type: 'object', properties: { leadId: { type: 'string' }, status: { type: 'string', enum: ['NEW', 'ACTIVE', 'HOT', 'COLD', 'CLOSED_WON', 'CLOSED_LOST'] } }, required: ['leadId'] } },
  { name: 'create_task', description: 'Create a follow-up task.', inputSchema: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, dueDate: { type: 'string', format: 'date-time' }, priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] } }, required: ['title'] } },
  { name: 'list_tasks', description: 'List tasks.', inputSchema: { type: 'object', properties: { status: { type: 'string', enum: ['pending', 'completed'] } } } },
  { name: 'summarize_workspace', description: 'Get workspace summary statistics.', inputSchema: { type: 'object', properties: {} } },
  { name: 'search_contacts', description: 'Search contacts by free-text query.', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'log_activity', description: 'Log an activity against a lead.', inputSchema: { type: 'object', properties: { leadId: { type: 'string' }, type: { type: 'string' }, description: { type: 'string' } }, required: ['description'] } },
];

type ToolExecutor = (session: MCPSession, args: Record<string, unknown>) => Promise<unknown>;

const executors: Record<string, ToolExecutor> = {
  async list_contacts(session, args) {
    const where: Record<string, unknown> = { workspaceId: session.workspaceId };
    const search = args['search'] as string | undefined;
    const limit = (args['limit'] as number) || 25;
    if (search) where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
    ];
    return prisma.contact.findMany({ where, take: Math.min(limit, 100), orderBy: { updatedAt: 'desc' } });
  },
  async get_contact(session, args) {
    return prisma.contact.findFirst({ where: { id: args['id'] as string, workspaceId: session.workspaceId }, include: { leads: true, activities: { orderBy: { createdAt: 'desc' }, take: 20 } } });
  },
  async create_contact(session, args) {
    return prisma.contact.create({ data: { workspaceId: session.workspaceId, firstName: args['firstName'] as string, lastName: args['lastName'] as string, email: (args['email'] as string) || null, phone: (args['phone'] as string) || null } });
  },
  async update_lead_status(session, args) {
    const lead = await prisma.lead.findFirst({ where: { id: args['leadId'] as string, workspaceId: session.workspaceId } });
    if (!lead) throw new Error('Lead not found');
    return prisma.lead.update({ where: { id: lead.id }, data: { status: args['status'] as 'NEW' | 'ACTIVE' | 'HOT' | 'COLD' | 'CLOSED_WON' | 'CLOSED_LOST' } });
  },
  async create_task(session, args) {
    return prisma.task.create({ data: { workspaceId: session.workspaceId, userId: session.userId, title: args['title'] as string, description: (args['description'] as string) || null, dueDate: args['dueDate'] ? new Date(args['dueDate'] as string) : null, priority: (args['priority'] as 'LOW' | 'MEDIUM' | 'HIGH') || 'MEDIUM' } });
  },
  async list_tasks(session, args) {
    const where: Record<string, unknown> = { workspaceId: session.workspaceId };
    if (args['status'] === 'pending') where.completed = false;
    if (args['status'] === 'completed') where.completed = true;
    return prisma.task.findMany({ where, orderBy: { dueDate: 'asc' } });
  },
  async summarize_workspace(session) {
    const [contacts, leads, hotLeads, tasks, deals] = await Promise.all([
      prisma.contact.count({ where: { workspaceId: session.workspaceId } }),
      prisma.lead.count({ where: { workspaceId: session.workspaceId } }),
      prisma.lead.count({ where: { workspaceId: session.workspaceId, status: 'HOT' } }),
      prisma.task.count({ where: { workspaceId: session.workspaceId, completed: false } }),
      prisma.deal.count({ where: { workspaceId: session.workspaceId } }),
    ]);
    return { contacts, leads, hotLeads, deals, pendingTasks: tasks, summary: `${contacts} contacts, ${leads} leads (${hotLeads} hot), ${deals} deals, ${tasks} pending tasks` };
  },
  async search_contacts(session, args) {
    const query = args['query'] as string;
    return prisma.contact.findMany({ where: { workspaceId: session.workspaceId, OR: [
      { firstName: { contains: query, mode: 'insensitive' } },
      { lastName: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
    ] }, take: 25 });
  },
  async log_activity(session, args) {
    return prisma.activity.create({ data: { type: (args['type'] as 'NOTE' | 'CALL' | 'EMAIL' | 'SMS') || 'NOTE', description: args['description'] as string, userId: session.userId, leadId: (args['leadId'] as string) || null } });
  },
};

export interface MCPResponse {
  jsonrpc: '2.0';
  id: number | string | null;
  result?: unknown;
  error?: { code: number; message: string };
}

export async function handleMCPRequest(method: string, params: Record<string, unknown>, id: number | string | null, session: MCPSession): Promise<MCPResponse> {
  switch (method) {
    case 'initialize':
      return { jsonrpc: '2.0', id, result: { protocolVersion: MCP_PROTOCOL_VERSION, capabilities: { tools: {} }, serverInfo: { name: SERVER_NAME, version: SERVER_VERSION } } };
    case 'notifications/initialized':
    case 'ping':
      return { jsonrpc: '2.0', id, result: {} };
    case 'tools/list':
      return { jsonrpc: '2.0', id, result: { tools: MCP_TOOLS } };
    case 'tools/call': {
      const toolName = params?.['name'] as string;
      const toolArgs = (params?.['arguments'] as Record<string, unknown>) || {};
      const tool = MCP_TOOLS.find((t) => t.name === toolName);
      if (!tool) return { jsonrpc: '2.0', id, error: { code: -32602, message: `Unknown tool: ${toolName}` } };
      const executor = executors[toolName];
      if (!executor) return { jsonrpc: '2.0', id, error: { code: -32601, message: `Tool not implemented: ${toolName}` } };
      try {
        const result = await executor(session, toolArgs);
        return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] } };
      } catch (err) {
        return { jsonrpc: '2.0', id, error: { code: -32000, message: err instanceof Error ? err.message : 'Tool execution failed' } };
      }
    }
    default:
      return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
  }
}

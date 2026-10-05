import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleMCPRequest } from '@/lib/mcp/server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import prisma from '@/lib/prisma';

/**
 * AgentCore MCP endpoint.
 * Accepts JSON-RPC 2.0 requests over HTTP POST.
 * Auth: session cookie OR `Authorization: Bearer <MCP_TOKEN>`.
 */
export async function POST(request: NextRequest) {
  const rl = rateLimit({ limit: 120, windowMs: 60_000, identifier: `mcp:${getClientIp(request)}` });
  if (!rl.success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } });
  }

  let session: { workspaceId: string; userId: string };
  const authHeader = request.headers.get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const expected = process.env.MCP_TOKEN;
    if (!expected || token !== expected) {
      return NextResponse.json({ jsonrpc: '2.0', id: null, error: { code: -32001, message: 'Invalid MCP token' } }, { status: 401 });
    }
    const firstUser = await prisma.user.findFirst({ select: { id: true } });
    const firstWorkspace = await prisma.workspace.findFirst({ select: { id: true } });
    if (!firstUser || !firstWorkspace) {
      return NextResponse.json({ jsonrpc: '2.0', id: null, error: { code: -32001, message: 'No workspace found' } }, { status: 404 });
    }
    session = { workspaceId: firstWorkspace.id, userId: firstUser.id };
  } else {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user) {
      return NextResponse.json({ jsonrpc: '2.0', id: null, error: { code: -32001, message: 'Unauthorized' } }, { status: 401 });
    }
    const workspace = await prisma.workspace.findFirst({ where: { members: { some: { userId: authSession.user.id } } }, select: { id: true } });
    if (!workspace) {
      return NextResponse.json({ jsonrpc: '2.0', id: null, error: { code: -32001, message: 'No workspace found' } }, { status: 404 });
    }
    session = { workspaceId: workspace.id, userId: authSession.user.id };
  }

  let body: { method?: string; params?: Record<string, unknown>; id?: number | string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, { status: 400 });
  }

  const { method, params = {}, id = null } = body;
  if (!method) {
    return NextResponse.json({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request: method required' } }, { status: 400 });
  }

  const response = await handleMCPRequest(method, params, id, session);
  return NextResponse.json(response);
}

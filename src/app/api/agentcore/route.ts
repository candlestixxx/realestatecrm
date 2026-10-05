import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeCommand } from '@/lib/agentcore/engine';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import prisma from '@/lib/prisma';

/**
 * AgentCore NL Command endpoint.
 * Translates natural-language commands into CRM actions.
 */
export async function POST(request: NextRequest) {
  const authSession = await getServerSession(authOptions);
  if (!authSession?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rl = rateLimit({ limit: 30, windowMs: 60_000, identifier: `agentcore:${getClientIp(request)}` });
  if (!rl.success) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } });
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { command, useLLM } = body;
    if (!command) return NextResponse.json({ error: 'Command is required' }, { status: 400 });

    const workspace = await prisma.workspace.findFirst({
      where: { members: { some: { userId: authSession.user.id } } },
      select: { id: true },
    });
    if (!workspace) return NextResponse.json({ error: 'No workspace found' }, { status: 404 });

    const result = await executeCommand(command, { workspaceId: workspace.id, userId: authSession.user.id }, { useLLMFallback: useLLM !== false });
    return NextResponse.json(result);
  } catch (error) {
    console.error('AgentCore error:', error);
    return NextResponse.json({ error: 'Failed to process command' }, { status: 500 });
  }
}

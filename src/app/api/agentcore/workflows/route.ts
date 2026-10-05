import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * AgentCore Workflow CRUD — list and create if/then automations.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspace = await prisma.workspace.findFirst({
    where: { members: { some: { userId: session.user.id } } },
    select: { id: true },
  });
  if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 404 });

  const workflows = await prisma.agentWorkflow.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json({ workflows });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspace = await prisma.workspace.findFirst({
    where: { members: { some: { userId: session.user.id } } },
    select: { id: true },
  });
  if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 404 });

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { name, description, trigger, actions, isActive } = body;
    if (!name || !trigger || !actions) {
      return NextResponse.json({ error: 'name, trigger, and actions are required' }, { status: 400 });
    }

    const workflow = await prisma.agentWorkflow.create({
      data: {
        name,
        description: description || null,
        trigger,
        actions: typeof actions === 'string' ? actions : JSON.stringify(actions),
        isActive: isActive !== false,
        workspaceId: workspace.id,
      },
    });
    return NextResponse.json({ workflow }, { status: 201 });
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 });
  }
}

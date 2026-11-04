import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

type Ctx = { params: { id: string } | Promise<{ id: string }> };

async function getWorkspace() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return prisma.workspace.findFirst({
    where: { members: { some: { userId: session.user.id } } },
    select: { id: true },
  });
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const workspace = await getWorkspace();
  if (!workspace) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await Promise.resolve(context.params);
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description;
    if (body.trigger !== undefined) data.trigger = body.trigger;
    if (body.actions !== undefined) data.actions = typeof body.actions === 'string' ? body.actions : JSON.stringify(body.actions);
    if (body.isActive !== undefined) data.isActive = body.isActive;

    const workflow = await prisma.agentWorkflow.update({
      where: { id, workspaceId: workspace.id },
      data,
    });
    return NextResponse.json({ workflow });
  } catch {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, context: Ctx) {
  const workspace = await getWorkspace();
  if (!workspace) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await Promise.resolve(context.params);
  try {
    await prisma.agentWorkflow.delete({ where: { id, workspaceId: workspace.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }
}

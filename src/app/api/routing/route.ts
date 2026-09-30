import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { routeLeadAction } from '@/lib/routing';

/**
 * GET /api/routing — List routing rules for the workspace.
 * POST /api/routing — Create a new routing rule.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspace = await prisma.workspace.findFirst({
    where: { members: { some: { userId: session.user.id } } },
    select: { id: true },
  });
  if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 404 });

  const rules = await prisma.leadRoutingRule.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ rules });
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
    const body = await request.json();
    const { name, description, source, segmentId, agentIds, isActive } = body;
    if (!name || !agentIds) {
      return NextResponse.json({ error: 'name and agentIds are required' }, { status: 400 });
    }

    const rule = await prisma.leadRoutingRule.create({
      data: {
        name,
        description: description || null,
        source: source || null,
        segmentId: segmentId || null,
        agentIds: Array.isArray(agentIds) ? agentIds.join(',') : agentIds,
        isActive: isActive !== false,
        workspaceId: workspace.id,
      },
    });
    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error('Error creating routing rule:', error);
    return NextResponse.json({ error: 'Failed to create routing rule' }, { status: 500 });
  }
}

/**
 * PATCH /api/routing — Trigger routing for a specific lead.
 */
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { leadId } = body;
    if (!leadId) return NextResponse.json({ error: 'leadId is required' }, { status: 400 });

    const result = await routeLeadAction(leadId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error routing lead:', error);
    return NextResponse.json({ error: 'Failed to route lead' }, { status: 500 });
  }
}

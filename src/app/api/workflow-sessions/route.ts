import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEFAULT_WORKSPACE_SLUG } from '@/lib/workspace-context';

/**
 * Workflow Sessions API
 * Persists wizard/workflow state so users can resume partially completed workflows.
 * GET: list sessions (filterable by type/status/leadId/dealId).
 * POST: create or update a session.
 * DELETE: remove a session.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId') || DEFAULT_WORKSPACE_SLUG;
  const type = searchParams.get('type');
  const status = searchParams.get('status');
  const leadId = searchParams.get('leadId');
  const dealId = searchParams.get('dealId');

  const where: Record<string, unknown> = { workspaceId };
  if (type) where.type = type;
  if (status) where.status = status;
  if (leadId) where.leadId = leadId;
  if (dealId) where.dealId = dealId;

  const sessions = await prisma.workflowSession.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      lead: { select: { id: true, contact: { select: { firstName: true, lastName: true } } } },
      deal: { select: { id: true, title: true } },
      user: { select: { name: true, email: true } },
    },
    take: 50,
  });

  return NextResponse.json({
    sessions: sessions.map(s => ({
      id: s.id,
      type: s.type,
      status: s.status,
      data: JSON.parse(s.data),
      leadId: s.leadId,
      dealId: s.dealId,
      leadName: s.lead?.contact
        ? s.lead.contact.firstName + ' ' + s.lead.contact.lastName
        : null,
      dealTitle: s.deal?.title || null,
      user: s.user,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { id, type, status, data, workspaceId, userId, leadId, dealId } = body;
  if (!type) {
    return NextResponse.json({ error: 'type required' }, { status: 400 });
  }

  const wsId = workspaceId || DEFAULT_WORKSPACE_SLUG;
  const dataJson = typeof data === 'string' ? data : JSON.stringify(data || {});

  if (id) {
    // P2025 guard — update on missing id throws → 500. findUnique → 404 first.
    const existing = await prisma.workflowSession.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const session = await prisma.workflowSession.update({
      where: { id },
      data: {
        status: status || undefined,
        data: dataJson,
      },
    });
    return NextResponse.json({ id: session.id, updated: true });
  }

  // FK validation — workspaceId must exist or Prisma throws P2003 → 500
  const workspace = await prisma.workspace.findUnique({ where: { id: wsId } });
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }
  // Optional FKs — validate only when provided
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  if (leadId) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }
  if (dealId) {
    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
  }

  // Create new session
  const session = await prisma.workflowSession.create({
    data: {
      type,
      status: status || 'DRAFT',
      data: dataJson,
      workspaceId: wsId,
      userId: userId || null,
      leadId: leadId || null,
      dealId: dealId || null,
    },
  });

  return NextResponse.json({ id: session.id, created: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  await prisma.workflowSession.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}

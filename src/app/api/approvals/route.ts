import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * Approval Workflows API
 * GET: list pending approvals
 * POST: create an approval request
 * PATCH: approve or reject
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspace = await prisma.workspace.findFirst({
    where: { members: { some: { userId: session.user.id } } },
    select: { id: true },
  });
  if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 404 });

  // Use Activity model for approval tracking
  const activities = await prisma.activity.findMany({
    where: {
      workspaceId: workspace.id,
      type: 'APPROVAL',
      content: { contains: 'PENDING' },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      lead: { select: { id: true, contact: { select: { firstName: true, lastName: true } } } },
    },
  });

  return NextResponse.json({ approvals: activities });
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
    const { title, description, leadId, assetType, assetUrl } = body;
    if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

    const content = JSON.stringify({
      title,
      description: description || '',
      assetType: assetType || 'content',
      assetUrl: assetUrl || null,
      status: 'PENDING',
    });

    const activity = await prisma.activity.create({
      data: {
        type: 'APPROVAL',
        content,
        workspaceId: workspace.id,
        userId: session.user.id,
        ...(leadId && { leadId }),
      },
    });

    return NextResponse.json({ approval: activity }, { status: 201 });
  } catch (error) {
    console.error('Error creating approval:', error);
    return NextResponse.json({ error: 'Failed to create approval' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { id, action, notes } = body;
    if (!id || !action) return NextResponse.json({ error: 'id and action are required' }, { status: 400 });

    const activity = await prisma.activity.findUnique({ where: { id } });
    if (!activity) return NextResponse.json({ error: 'Approval not found' }, { status: 404 });

    let content: any;
    try { content = JSON.parse(activity.content); } catch { content = { title: activity.content }; }
    content.status = action.toUpperCase(); // APPROVED or REJECTED
    content.reviewedAt = new Date().toISOString();
    content.reviewedBy = session.user.id;
    if (notes) content.notes = notes;

    await prisma.activity.update({
      where: { id },
      data: { content: JSON.stringify(content) },
    });

    return NextResponse.json({ success: true, status: content.status });
  } catch (error) {
    console.error('Error updating approval:', error);
    return NextResponse.json({ error: 'Failed to update approval' }, { status: 500 });
  }
}

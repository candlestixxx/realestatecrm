import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEFAULT_WORKSPACE_SLUG } from '@/lib/workspace-context';

/**
 * Audit Trail API
 * Tracks all data mutations for compliance and debugging.
 * Uses Activity model with type=AUDIT for persistence.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId') || DEFAULT_WORKSPACE_SLUG;
  const entityType = searchParams.get('entityType'); // lead, contact, deal, listing, offer
  const entityId = searchParams.get('entityId');
  const action = searchParams.get('action'); // CREATE, UPDATE, DELETE
  const userId = searchParams.get('userId');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50'), 200);

  const where: any = {
    workspaceId,
    type: 'AUDIT',
  };

  // Parse content filters from JSON
  const activities = await prisma.activity.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: { user: { select: { name: true, email: true } } },
  });

  // Client-side filtering for JSON fields
  let filtered = activities;
  if (entityType) filtered = filtered.filter(a => {
    try { return JSON.parse(a.content).entityType === entityType; } catch { return false; }
  });
  if (entityId) filtered = filtered.filter(a => {
    try { return JSON.parse(a.content).entityId === entityId; } catch { return false; }
  });
  if (action) filtered = filtered.filter(a => {
    try { return JSON.parse(a.content).action === action; } catch { return false; }
  });
  if (userId) filtered = filtered.filter(a => a.userId === userId);

  return NextResponse.json({
    entries: filtered.map(a => {
      let parsed: any = {};
      try { parsed = JSON.parse(a.content); } catch { /* raw */ }
      return {
        id: a.id,
        ...parsed,
        user: a.user,
        timestamp: a.createdAt,
      };
    }),
    pagination: { page, pageSize, total: filtered.length },
  });
}

/**
 * POST: Log an audit entry.
 * Called internally after any data mutation.
 */
export async function POST(request: NextRequest) {
  let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  const { entityType, entityId, action, changes, userId, workspaceId } = body;

  if (!entityType || !entityId || !action) {
    return NextResponse.json({ error: 'entityType, entityId, action required' }, { status: 400 });
  }

  const entry = {
    entityType,
    entityId,
    action, // CREATE, UPDATE, DELETE
    changes: changes || null, // { field: { from, to } }
    ip: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  };

  const activity = await prisma.activity.create({
    data: {
      type: 'AUDIT',
      content: JSON.stringify(entry),
      userId: userId || null,
      workspaceId: workspaceId || DEFAULT_WORKSPACE_SLUG,
    },
  });

  return NextResponse.json({ id: activity.id, logged: true }, { status: 201 });
}

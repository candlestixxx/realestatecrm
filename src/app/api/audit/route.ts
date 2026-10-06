import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEFAULT_WORKSPACE_SLUG } from '@/lib/workspace-context';

/**
 * Audit Trail API
 * Uses the AuditLog model with queryable columns (not Activity JSON blobs).
 * GET: filterable, paginated audit log.
 * POST: record an audit entry.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId') || DEFAULT_WORKSPACE_SLUG;
  const entityType = searchParams.get('entityType');
  const entityId = searchParams.get('entityId');
  const action = searchParams.get('action');
  const userId = searchParams.get('userId');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
  const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get('pageSize') || '50') || 50));

  const where: Record<string, unknown> = { workspaceId };
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (action) where.action = action;
  if (userId) where.userId = userId;

  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    entries: entries.map(e => ({
      id: e.id,
      entityType: e.entityType,
      entityId: e.entityId,
      action: e.action,
      changes: e.changes ? JSON.parse(e.changes) : null,
      ip: e.ipAddress,
      timestamp: e.createdAt,
      user: e.user,
    })),
    pagination: { page, pageSize, total },
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
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { entityType, entityId, action, changes, userId, workspaceId } = body;

  if (!entityType || !action) {
    return NextResponse.json({ error: 'entityType and action required' }, { status: 400 });
  }

  const entry = await prisma.auditLog.create({
    data: {
      action,
      entityType,
      entityId: entityId || null,
      userId: userId || null,
      workspaceId: workspaceId || DEFAULT_WORKSPACE_SLUG,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      changes: changes ? JSON.stringify(changes) : null,
    },
  });

  return NextResponse.json({ id: entry.id, logged: true }, { status: 201 });
}

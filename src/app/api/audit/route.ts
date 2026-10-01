import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');
  const entityType = searchParams.get('entityType');
  const userId = searchParams.get('userId');
  const limit = parseInt(searchParams.get('limit') || '50');

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(workspaceId && { workspaceId }),
      ...(entityType && { entityType }),
      ...(userId && { userId }),
    },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return NextResponse.json(logs);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, entityType, entityId, userId, workspaceId, ipAddress, userAgent, changes } = body;

  if (!action || !entityType || !workspaceId) {
    return NextResponse.json({ error: 'action, entityType, workspaceId required' }, { status: 400 });
  }

  const log = await prisma.auditLog.create({
    data: { action, entityType, entityId, userId, workspaceId, ipAddress, userAgent, changes: changes ? JSON.stringify(changes) : null },
  });
  return NextResponse.json(log, { status: 201 });
}

// ─── MyPlus Sync History API ────────────────────────────────────────────────
//
// Returns the sync log history for display on the dashboard.
//
// GET  /api/sync-history          → last 30 sync logs across all integrations
// GET  /api/sync-history?limit=5  → last 5 sync logs
// ───────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workspaceId = session.user.workspaces?.[0]?.workspaceId;
  if (!workspaceId) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
  }

  const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '30'), 100);

  const logs = await prisma.myPlusSyncLog.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      integration: {
        select: { email: true, isActive: true },
      },
    },
  });

  const integration = await prisma.myPlusLeadsIntegration.findUnique({
    where: { workspaceId },
    select: {
      isActive: true,
      lastSyncAt: true,
      lastID: true,
      email: true,
    },
  });

  return NextResponse.json({
    integration,
    logs,
  });
}

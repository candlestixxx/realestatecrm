import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess, workspaceErrorResponse } from '@/lib/workspace-access';
import { syncBrokerFeed, syncMlsConnection } from '@/lib/reso-api';
import prisma from '@/lib/prisma';

// POST /api/mls/sync  { connectionId? }
// With a connectionId: sync that agent's own MLS connection.
// Without: sync the brokerage RESO feed (env token) and auto-assign
// listings to agents by their registered MLS Member ID.
export async function POST(request: NextRequest) {
  let access;
  try {
    const session = await getServerSession(authOptions);
    access = await requireWorkspaceAccess(session);
  } catch (e) {
    return workspaceErrorResponse(e) || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let body: any = {};
  try { body = await request.json(); } catch { /* empty body = broker feed */ }
  try {
    if (body.connectionId) {
      const row = await prisma.mlsConnection.findFirst({
        where: { id: body.connectionId, userId: access.userId, workspaceId: access.workspaceId },
      });
      if (!row) return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
      const result = await syncMlsConnection(row.id);
      return NextResponse.json({ ok: true, scope: 'agent', ...result });
    }
    const result = await syncBrokerFeed(access.workspaceId);
    return NextResponse.json({ ok: true, scope: 'broker', ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message.slice(0, 400) }, { status: 502 });
  }
}

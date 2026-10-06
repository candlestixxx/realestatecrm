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

  const workspaceId = (session.user as any).workspaceId || (session.user as any).workspaces?.[0]?.workspaceId || (session.user as any).workspaces?.[0]?.id;
  if (!workspaceId) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
  }

  const limit = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '30') || 30));

  // MyPlusSyncLog model may not exist in schema ? handle gracefully
  let logs: any[] = [];
  try {
    logs = await (prisma as any).myPlusSyncLog?.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        integration: {
          select: { email: true, isActive: true },
        },
      },
    }) || [];
  } catch {
    logs = [];
  }

  const integration = await prisma.myPlusLeadsIntegration.findUnique({
    where: { workspaceId },
    select: {
      isActive: true,
      lastSyncAt: true,
      lastID: true,
      email: true,
    },
  }).catch(() => null);

  return NextResponse.json({
    integration,
    logs,
  });
}

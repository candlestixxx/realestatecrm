import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { resolveWorkspaceAccess } from '@/lib/workspace-access';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const access = await resolveWorkspaceAccess(session);

  if (!access) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const sinceParam = url.searchParams.get('since');
    const sinceDate = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 60000);

    const newLeads = await prisma.lead.findMany({
      where: {
        workspaceId: access.workspaceId,
        isRead: false,
        createdAt: {
          gt: sinceDate,
        },
      },
      include: {
        contact: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ newLeads });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

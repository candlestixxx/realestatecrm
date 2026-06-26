import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const access = await requireWorkspaceAccess(session);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const listings = await prisma.propertyListing.findMany({
      where: {
        workspaceId: access.workspaceId,
        ...(status && { status })
      },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ listings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}

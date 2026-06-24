import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const access = await requireWorkspaceAccess(session);

    const { id } = await props.params;

    const listing = await prisma.propertyListing.findUnique({
      where: {
        id,
        workspaceId: access.workspaceId,
      }
    });

    if (!listing) {
       return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ listing });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}

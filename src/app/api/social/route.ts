import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * Social account connections management.
 * GET: list connected accounts
 * POST: connect a new account (stores OAuth tokens)
 * DELETE: disconnect an account
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspace = await prisma.workspace.findFirst({
    where: { members: { some: { userId: session.user.id } } },
    select: { id: true },
  });
  if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 404 });

  const accounts = await prisma.socialAccount.findMany({
    where: { workspaceId: workspace.id },
    select: {
      id: true, platform: true, accountName: true,
      isActive: true, lastSyncAt: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ accounts });
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
    const body = await request.json();
    const { platform, accountName, accessToken, refreshToken } = body;
    if (!platform || !accountName) {
      return NextResponse.json({ error: 'platform and accountName are required' }, { status: 400 });
    }

    const account = await prisma.socialAccount.upsert({
      where: { id: `${workspace.id}_${platform}_${accountName}` },
      update: { accessToken: accessToken || null, isActive: true, lastSyncAt: new Date() },
      create: {
        workspaceId: workspace.id,
        platform,
        accountName,
        accessToken: accessToken || null,
      },
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    console.error('Error connecting social account:', error);
    return NextResponse.json({ error: 'Failed to connect account' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  await prisma.socialAccount.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ success: true });
}

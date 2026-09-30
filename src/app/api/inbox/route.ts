import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * Unified Inbox API
 * GET: list messages (filter by channel, read status, lead)
 * PATCH: mark messages as read
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspace = await prisma.workspace.findFirst({
    where: { members: { some: { userId: session.user.id } } },
    select: { id: true },
  });
  if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 404 });

  const url = new URL(request.url);
  const channel = url.searchParams.get('channel');
  const isRead = url.searchParams.get('isRead');
  const leadId = url.searchParams.get('leadId');
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 100);

  const where: Record<string, unknown> = { workspaceId: workspace.id };
  if (channel) where.channel = channel;
  if (isRead !== null) where.isRead = isRead === 'true';
  if (leadId) where.leadId = leadId;

  const [messages, unreadCount] = await Promise.all([
    prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        lead: { select: { id: true, contact: { select: { firstName: true, lastName: true } } } },
      },
    }),
    prisma.message.count({ where: { workspaceId: workspace.id, isRead: false } }),
  ]);

  return NextResponse.json({ messages, unreadCount });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { messageIds, markAll } = body;

    if (markAll) {
      const workspace = await prisma.workspace.findFirst({
        where: { members: { some: { userId: session.user.id } } },
        select: { id: true },
      });
      if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 404 });

      await prisma.message.updateMany({
        where: { workspaceId: workspace.id, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    if (Array.isArray(messageIds) && messageIds.length > 0) {
      await prisma.message.updateMany({
        where: { id: { in: messageIds } },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

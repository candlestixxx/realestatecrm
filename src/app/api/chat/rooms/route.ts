import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/chat/rooms — list rooms the current user participates in
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rooms = await prisma.chatRoom.findMany({
    where: {
      participants: {
        some: { userId: session.user.id },
      },
    },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { sender: { select: { id: true, name: true } } },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ rooms });
}

// POST /api/chat/rooms — create a DIRECT or GROUP room
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { type, name, participantIds } = body as {
    type: 'DIRECT' | 'GROUP';
    name?: string;
    participantIds: string[];
  };

  if (!participantIds?.length) {
    return NextResponse.json({ error: 'participantIds required' }, { status: 400 });
  }

  // For DIRECT rooms, check if one already exists between these two users
  if (type === 'DIRECT' && participantIds.length === 1) {
    const otherId = participantIds[0];
    const existing = await prisma.chatRoom.findFirst({
      where: {
        type: 'DIRECT',
        participants: {
          every: {
            userId: { in: [session.user.id, otherId] },
          },
        },
        AND: [
          { participants: { some: { userId: session.user.id } } },
          { participants: { some: { userId: otherId } } },
        ],
      },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
      },
    });
    if (existing) return NextResponse.json({ room: existing });
  }

  const workspace = await prisma.workspace.findFirst({
    where: { members: { some: { userId: session.user.id } } },
  });

  const room = await prisma.chatRoom.create({
    data: {
      type,
      name: type === 'GROUP' ? name || 'Group Chat' : null,
      workspaceId: workspace!.id,
      createdById: session.user.id,
      participants: {
        create: [
          { userId: session.user.id, role: 'ADMIN' },
          ...participantIds.map((id) => ({ userId: id, role: 'MEMBER' })),
        ],
      },
    },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
    },
  });

  return NextResponse.json({ room }, { status: 201 });
}

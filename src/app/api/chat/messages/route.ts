import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/chat/messages?roomId=xxx — list messages in a room
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roomId = req.nextUrl.searchParams.get('roomId');
  if (!roomId) {
    return NextResponse.json({ error: 'roomId required' }, { status: 400 });
  }

  // Verify user is a participant
  const isParticipant = await prisma.chatParticipant.findUnique({
    where: { roomId_userId: { roomId, userId: session.user.id } },
  });
  if (!isParticipant) {
    return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { roomId },
    include: { sender: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });

  return NextResponse.json({ messages });
}

// POST /api/chat/messages — send a message to a room
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { roomId, text } = body as { roomId: string; text: string };

  if (!roomId || !text?.trim()) {
    return NextResponse.json({ error: 'roomId and text required' }, { status: 400 });
  }

  // Verify user is a participant
  const isParticipant = await prisma.chatParticipant.findUnique({
    where: { roomId_userId: { roomId, userId: session.user.id } },
  });
  if (!isParticipant) {
    return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
  }

  const message = await prisma.chatMessage.create({
    data: {
      roomId,
      senderId: session.user.id,
      body: text.trim(),
    },
    include: { sender: { select: { id: true, name: true, image: true } } },
  });

  // Touch room updatedAt for sorting
  await prisma.chatRoom.update({
    where: { id: roomId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ message }, { status: 201 });
}

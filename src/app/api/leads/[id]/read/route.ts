import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const lead = await prisma.lead.update({
      where: { id },
      data: { isRead: true },
      select: { id: true, isRead: true },
    });

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    console.error('Error marking lead as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

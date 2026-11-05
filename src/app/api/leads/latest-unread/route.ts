import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const since = request.nextUrl.searchParams.get('since');
  const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (isNaN(sinceDate.getTime())) {
    return NextResponse.json({ error: 'Invalid since parameter' }, { status: 400 });
  }

  try {
    const newLeads = await prisma.lead.findMany({
      where: {
        isRead: false,
        createdAt: { gt: sinceDate },
      },
      include: {
        contact: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ newLeads });
  } catch (error) {
    console.error('Error fetching latest unread leads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/posts?status=SCHEDULED — list social posts, optionally filtered by status
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  try {
    const posts = await prisma.socialPost.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { scheduledAt: 'desc' },
      take: 100,
    });
    return NextResponse.json(posts);
  } catch {
    return NextResponse.json([]);
  }
}

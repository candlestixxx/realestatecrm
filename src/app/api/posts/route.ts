import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/posts?status=SCHEDULED
 * Lists scheduled/created social posts for the publishing calendar.
 * Currently reads from BlogPost (the only content model in Prisma schema).
 * A dedicated SocialPost model can be added when contentplanner DB sync is wired.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  try {
    const posts = await prisma.blogPost.findMany({
      where: status === 'SCHEDULED' ? { published: false } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        title: true,
        slug: true,
        published: true,
        createdAt: true,
      },
    });

    // Map to the shape the calendar page expects
    const mapped = posts.map((p) => ({
      id: p.id,
      content: p.title,
      status: p.published ? 'PUBLISHED' : 'SCHEDULED',
      scheduledAt: p.createdAt.toISOString(),
      platform: 'blog',
    }));

    return NextResponse.json(mapped);
  } catch {
    return NextResponse.json([]);
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getWorkspaceScope } from '@/lib/workspace-context';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const domain = url.searchParams.get('domain');

    if (!domain) {
       // Authenticated generic fetch
       const session = await getServerSession(authOptions);
       if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

       const { workspaceId } = await getWorkspaceScope(session);
       const posts = await prisma.blogPost.findMany({
         where: { workspaceId },
         orderBy: { createdAt: 'desc' }
       });
       return NextResponse.json(posts);
    }

    // Public fetch via tenant domain routing
    const landingPage = await prisma.landingPage.findFirst({
       where: {
         OR: [
           { customDomain: domain },
           { subdomain: domain },
           { slug: domain }
         ]
       }
    });

    if (!landingPage) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const posts = await prisma.blogPost.findMany({
      where: {
        workspaceId: landingPage.workspaceId,
        isPublished: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(posts);

  } catch (error) {
    console.error('Blog API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 });
  }
}

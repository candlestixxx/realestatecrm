import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';

export default async function TenantBlogIndexPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;

  const tenantSite = await prisma.landingPage.findFirst({
    where: {
      OR: [
        { customDomain: domain },
        { subdomain: domain },
        { slug: domain }
      ]
    }
  });

  if (!tenantSite) {
    notFound();
  }

  const posts = await prisma.blogPost.findMany({
    where: {
      workspaceId: tenantSite.workspaceId,
      isPublished: true
    },
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { name: true, image: true } } }
  });

  return (
    <div className="max-w-5xl mx-auto py-16 px-6">
      <h1 className="text-4xl font-extrabold mb-4 text-center">Our Blog</h1>
      <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">Latest insights, market updates, and real estate news from {tenantSite.title}.</p>

      {posts.length === 0 ? (
        <div className="text-center py-24 bg-muted/30 rounded-2xl border border-dashed border-border">
          <p className="text-muted-foreground">No articles published yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map(post => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group flex flex-col bg-card border border-border shadow-sm hover:shadow-lg transition-all rounded-2xl overflow-hidden">
              <div className="aspect-[16/9] bg-muted relative overflow-hidden">
                {post.imageUrl ? (
                  <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-primary/5">
                    <span className="opacity-50 font-bold uppercase tracking-wider text-xs">No Image</span>
                  </div>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{post.title}</h3>
                <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-1">{post.excerpt || post.content.substring(0, 150) + '...'}</p>
                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-border">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                    {post.author?.image ? (
                      <img src={post.author.image} alt={post.author.name || 'Author'} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-primary text-xs font-bold">{post.author?.name?.charAt(0) || 'A'}</span>
                    )}
                  </div>
                  <div className="text-xs">
                    <div className="font-semibold">{post.author?.name || 'Agent'}</div>
                    <div className="text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

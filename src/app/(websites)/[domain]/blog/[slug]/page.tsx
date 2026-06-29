import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function TenantBlogPostPage({ params }: { params: Promise<{ domain: string, slug: string }> }) {
  const { domain, slug } = await params;

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

  const post = await prisma.blogPost.findFirst({
    where: {
      slug: slug,
      workspaceId: tenantSite.workspaceId,
      isPublished: true
    },
    include: { author: { select: { name: true, image: true } } }
  });

  if (!post) {
    notFound();
  }

  return (
    <article className="max-w-4xl mx-auto py-16 px-6">
      <div className="mb-8">
        <Link href="/blog" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog
        </Link>
      </div>

      <header className="mb-12 text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">{post.title}</h1>

        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              {post.author?.image ? (
                <img src={post.author.image} alt={post.author.name || 'Author'} className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary text-[10px] font-bold">{post.author?.name?.charAt(0) || 'A'}</span>
              )}
            </div>
            <span className="font-semibold text-foreground">{post.author?.name || 'Agent'}</span>
          </div>
          <span>•</span>
          <time dateTime={post.createdAt.toISOString()}>
            {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </time>
        </div>
      </header>

      {post.imageUrl && (
        <div className="aspect-[21/9] w-full bg-muted rounded-3xl overflow-hidden mb-12 border border-border shadow-xl">
          <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="prose prose-lg dark:prose-invert prose-primary mx-auto max-w-3xl leading-relaxed">
        {/* In a production scenario, you would parse the markdown or HTML securely here. */}
        {/* For this MVP, we render raw text with simple line breaks. */}
        {post.content.split('\n').map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}

import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { AgentSiteChatWidget } from '@/components/websites/AgentSiteChatWidget';
import { LeadCaptureModal } from '@/components/websites/LeadCaptureModal';

export default async function TenantWebsitePage({ params }: { params: Promise<{ domain: string }> }) {
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

  let blocks = [];
  try {
    blocks = JSON.parse(tenantSite.blocks || '[]');
  } catch (e) {
    console.error('Failed to parse site blocks', e);
  }

  return (
    <div className="tenant-site w-full relative">
      {blocks.map((block: any, idx: number) => {
        if (block.type === 'HEADER') {
          return (
            <header key={idx} className="bg-primary text-primary-foreground py-24 text-center">
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">{block.title}</h1>
              <p className="text-lg md:text-xl font-medium opacity-90 max-w-2xl mx-auto">{block.subtitle}</p>
            </header>
          );
        }

        if (block.type === 'PROPERTY') {
          return (
            <section key={idx} className="max-w-5xl mx-auto py-16 px-6">
              <div className="bg-card border border-border shadow-lg rounded-2xl overflow-hidden p-8 flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-4">
                  <div className="inline-block px-3 py-1 bg-green-500/10 text-green-600 font-bold text-xs uppercase tracking-wider rounded-full">
                    Just Listed
                  </div>
                  <h2 className="text-3xl font-black">{block.address}</h2>
                  <div className="text-2xl font-bold text-primary">${block.price?.toLocaleString()}</div>
                  <div className="flex gap-4 text-sm font-semibold text-muted-foreground">
                    <span>{block.beds} Beds</span>
                    <span>{block.baths} Baths</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed pt-2">{block.remarks}</p>
                </div>
              </div>
            </section>
          );
        }

        if (block.type === 'VIDEO') {
           return (
            <section key={idx} className="max-w-4xl mx-auto py-16 px-6 text-center">
              <h3 className="text-2xl font-bold mb-8">{block.title}</h3>
              <div className="aspect-video bg-muted rounded-2xl overflow-hidden border border-border">
                {block.videoUrl ? (
                  <iframe
                    src={block.videoUrl}
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground font-medium">
                    Video Placeholder
                  </div>
                )}
              </div>
            </section>
           )
        }

        if (block.type === 'LEAD_CAPTURE') {
          return (
            <section key={idx} className="bg-muted py-24">
              <div className="max-w-xl mx-auto px-6 text-center space-y-8">
                <h3 className="text-3xl font-extrabold">Ready to make a move?</h3>
                <p className="text-muted-foreground">Contact us today to schedule a private showing or request a free home valuation.</p>
                <form className="bg-background border border-border p-6 rounded-2xl shadow-xl space-y-4 text-left">
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                     <input type="text" className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2" placeholder="John Doe" />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</label>
                     <input type="email" className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2" placeholder="john@example.com" />
                  </div>
                  <button type="button" className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:bg-primary/90 transition-colors mt-4">
                    {block.ctaText || "Submit Inquiry"}
                  </button>
                </form>
              </div>
            </section>
          )
        }

        return null;
      })}

      <AgentSiteChatWidget tenantName={tenantSite.title} />
      <LeadCaptureModal tenantName={tenantSite.title} />
    </div>
  );
}

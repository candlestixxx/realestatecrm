import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { ImageWorkflow } from '@/components/media-pipeline/image-workflow';
import { VideoWorkflow } from '@/components/media-pipeline/video-workflow';
import { IntegrationWorkflow } from '@/components/media-pipeline/integration-workflow';
import { PipelineTriggerPanel } from '@/components/media-pipeline/pipeline-trigger-panel';
import prisma from '@/lib/prisma';

export default async function MarketingMediaPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const listingId = typeof searchParams?.listingId === 'string' ? searchParams.listingId : undefined;

  const deals = await prisma.deal.findMany({
    where: { workspaceId: access.workspaceId },
    select: { id: true, title: true }
  });

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Header */}
      <header className="border-b border-border bg-muted/10">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary mb-4">
            Marketing Studio
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Media Pipeline</h1>
          <p className="text-lg text-muted-foreground max-w-3xl font-medium">
            Generate branded property variations, assemble reels, and publish to your landing pages and social channels seamlessly.
          </p>
          {listingId && (
            <div className="mt-4 text-xs font-semibold text-primary uppercase tracking-wide bg-primary/10 border border-primary/20 inline-block px-3 py-1.5 rounded-md">
              Active Listing Context: {listingId}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-16">
        <section>
          <PipelineTriggerPanel deals={deals} activeListingId={listingId} />
        </section>

        <section>
          <ImageWorkflow listingId={listingId} />
        </section>

        <hr className="border-border" />

        <section>
          <VideoWorkflow listingId={listingId} />
        </section>

        <hr className="border-border" />

        <section>
          <IntegrationWorkflow listingId={listingId} />
        </section>
      </main>
    </div>
  );
}

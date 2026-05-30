import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { ImageWorkflow } from '@/components/media-pipeline/image-workflow';
import { VideoWorkflow } from '@/components/media-pipeline/video-workflow';
import { IntegrationWorkflow } from '@/components/media-pipeline/integration-workflow';

export default async function MarketingMediaPage() {
  const session = await getServerSession(authOptions);
  await requireWorkspaceAccess(session);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Header */}
      <header className="border-b border-border bg-muted/10">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary mb-4">
            Marketing Studio
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Media Pipeline</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Generate branded property variations, assemble reels, and publish to your landing pages and social channels seamlessly.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-16">
        <section>
          <ImageWorkflow />
        </section>

        <hr className="border-border" />

        <section>
          <VideoWorkflow />
        </section>

        <hr className="border-border" />

        <section>
          <IntegrationWorkflow />
        </section>
      </main>
    </div>
  );
}

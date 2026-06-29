import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import prisma from '@/lib/prisma';
import WebsitesClient from '@/components/websites/WebsitesClient';

export default async function AgentWebsitesPage() {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);
  const workspaceId = access.workspaceId;

  const landingPages = await prisma.landingPage.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <WebsitesClient landingPages={landingPages} workspaceId={workspaceId} />
    </div>
  );
}

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import prisma from '@/lib/prisma';
import CampaignsListClient from '@/components/CampaignsListClient';

export default async function CampaignsPage() {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);
  const workspaceId = access.workspaceId;

  const campaigns = await prisma.smartPlan.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { leads: true },
      },
    },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <CampaignsListClient campaigns={campaigns} />
    </div>
  );
}

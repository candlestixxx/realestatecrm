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

  const leads = await prisma.lead.findMany({
    where: { workspaceId },
    orderBy: { contact: { firstName: 'asc' } },
    select: {
      id: true,
      contact: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  const segments = await prisma.segment.findMany({
    where: { workspaceId },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
    },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <CampaignsListClient
        campaigns={campaigns}
        leads={leads.map(l => ({
          id: l.id,
          name: `${l.contact.firstName} ${l.contact.lastName || ''}`.trim(),
          email: l.contact.email,
          phone: l.contact.phone,
        }))}
        segments={segments}
      />
    </div>
  );
}

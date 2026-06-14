import { getServerSession } from 'next-auth/next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { createActivityAction as addActivity } from '@/lib/actions/activity';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import DealDetailLayoutClient from '@/components/DealDetailLayoutClient';

export default async function DealDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await props.params;

  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  const deal = await prisma.deal.findFirst({
    where: { id: resolvedParams.id, workspaceId: access.workspaceId },
    include: {
      contact: true,
      workspace: true,
      tasks: true,
      Activity: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!deal) {
    notFound();
  }

  return (
    <DealDetailLayoutClient
      deal={deal as any}
      userRole={access.workspaceRole}
      addActivityAction={addActivity}
    />
  );
}
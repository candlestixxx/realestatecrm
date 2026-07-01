import { getServerSession } from 'next-auth/next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { createActivityAction as addActivity } from '@/lib/actions/activity';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import LeadDetailLayoutClient from '@/components/LeadDetailLayoutClient';

export default async function LeadDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const resolvedParams = await props.params;

  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  const lead = await prisma.lead.findFirst({
    where: { id: resolvedParams.id, workspaceId: access.workspaceId },
    include: {
      contact: {
        include: { deals: true }
      },
      tasks: true,
      workspace: true,
      searchAlerts: true,
      Activity: {
        orderBy: { createdAt: 'desc' },
      },
      WorkflowSession: {
        orderBy: { updatedAt: 'desc' },
      },
    },
  });

  if (!lead) {
    notFound();
  }

  // Auto-mark lead as read when details page is loaded
  if (!lead.isRead) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { isRead: true },
    });
    lead.isRead = true;
  }

  const campaigns = await prisma.smartPlan.findMany({
    where: { workspaceId: access.workspaceId, isActive: true },
    select: { id: true, name: true, description: true, steps: true },
  });

  const siblingLeads = await prisma.lead.findMany({
    where: { workspaceId: access.workspaceId },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
  });

  const leadIndex = siblingLeads.findIndex((s) => s.id === lead.id);
  const prevLeadId = leadIndex > 0 ? siblingLeads[leadIndex - 1].id : null;
  const nextLeadId = leadIndex < siblingLeads.length - 1 ? siblingLeads[leadIndex + 1].id : null;

  const allSegments = await prisma.segment.findMany({
    where: { workspaceId: access.workspaceId },
    select: { id: true, name: true },
  });

  const workspaces = await prisma.workspace.findMany({
    where: {
      members: {
        some: { userId: access.userId },
      },
    },
  });

  const users = await prisma.user.findMany({
    where: {
      workspaces: {
        some: { workspaceId: access.workspaceId },
      },
    },
    select: { id: true, name: true },
  });

  return (
    <LeadDetailLayoutClient
      lead={lead as any}
      campaigns={campaigns}
      siblingLeadsCount={siblingLeads.length}
      leadIndex={leadIndex}
      prevLeadId={prevLeadId}
      nextLeadId={nextLeadId}
      allSegments={allSegments}
      users={users}
      workspaces={workspaces}
      addActivityAction={addActivity}
    />
  );
}

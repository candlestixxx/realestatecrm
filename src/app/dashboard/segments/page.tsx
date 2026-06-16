import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import prisma from '@/lib/prisma';
import { seedSegmentsIfEmpty, createSegmentAction } from '@/lib/actions/segment';
import { sendMassEmailToSegmentAction } from '@/lib/actions/email';
import SegmentsClient from '@/components/SegmentsClient';

export default async function SegmentsPage() {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);
  const workspaceId = access.workspaceId;

  // Auto-seed default segments (Preforeclosures, FSBO, Expireds) if empty
  await seedSegmentsIfEmpty(workspaceId);

  // Fetch segments with leads and their contacts
  const segments = await prisma.segment.findMany({
    where: { workspaceId },
    orderBy: { name: 'asc' },
    include: {
      leads: {
        include: { contact: true },
      },
    },
  });

  // Fetch all leads in the workspace to allow manually adding leads to segments
  const allLeads = await prisma.lead.findMany({
    where: { workspaceId },
    include: { contact: true },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch smart plans in the workspace to allow bulk enrollment
  const smartPlans = await prisma.smartPlan.findMany({
    where: { workspaceId },
    orderBy: { name: 'asc' },
  });

  // Map database leads mapping correctly
  const mappedSegments = segments.map(seg => ({
    id: seg.id,
    name: seg.name,
    description: seg.description,
    isPinned: seg.isPinned,
    leads: seg.leads.map(l => ({
      id: l.id,
      type: l.type,
      status: l.status,
      contact: {
        id: l.contact.id,
        firstName: l.contact.firstName,
        lastName: l.contact.lastName,
        email: l.contact.email,
        phone: l.contact.phone,
      },
      createdAt: l.createdAt
    }))
  }));

  const mappedAllLeads = allLeads.map(l => ({
    id: l.id,
    type: l.type,
    status: l.status,
    contact: {
      id: l.contact.id,
      firstName: l.contact.firstName,
      lastName: l.contact.lastName,
      email: l.contact.email,
      phone: l.contact.phone,
    },
    createdAt: l.createdAt
  }));

  const mappedSmartPlans = smartPlans.map(sp => ({
    id: sp.id,
    name: sp.name,
    description: sp.description
  }));

  return (
    <SegmentsClient
      initialSegments={mappedSegments}
      allLeads={mappedAllLeads}
      smartPlans={mappedSmartPlans}
      sendMassEmailToSegmentAction={sendMassEmailToSegmentAction}
      createSegmentAction={createSegmentAction}
    />
  );
}

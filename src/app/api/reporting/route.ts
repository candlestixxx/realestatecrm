import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEFAULT_WORKSPACE_SLUG } from '@/lib/workspace-context';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId') || DEFAULT_WORKSPACE_SLUG;

  const [
    totalLeads, leadsByStatus, totalDeals, dealsByStage,
    totalContacts, totalListings, listingsByStatus,
    totalPartners, referralsByStatus, recentActivity,
    openTasks, totalTasks, activeCampaigns, activeWorkflows,
  ] = await Promise.all([
    prisma.lead.count({ where: { workspaceId } }),
    prisma.lead.groupBy({ by: ['status'], where: { workspaceId }, _count: true }),
    prisma.deal.count({ where: { workspaceId } }),
    prisma.deal.groupBy({ by: ['stage'], where: { workspaceId }, _count: true, _sum: { value: true } }),
    prisma.contact.count({ where: { workspaceId } }),
    prisma.listing.count({ where: { workspaceId } }),
    prisma.listing.groupBy({ by: ['status'], where: { workspaceId }, _count: true, _sum: { listPrice: true } }),
    prisma.partner.count({ where: { workspaceId, isActive: true } }),
    prisma.referral.groupBy({ by: ['status'], where: { workspaceId }, _count: true }),
    prisma.activity.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' }, take: 10, include: { user: { select: { name: true } } } }),
    prisma.task?.count({ where: { workspaceId, status: { not: 'DONE' } } }).catch(() => 0) ?? Promise.resolve(0),
    prisma.task?.count({ where: { workspaceId } }).catch(() => 0) ?? Promise.resolve(0),
    prisma.smartPlan?.count({ where: { workspaceId, isActive: true } }).catch(() => 0) ?? Promise.resolve(0),
    prisma.workflowSession?.count({ where: { workspaceId, status: { not: 'COMPLETED' } } }).catch(() => 0) ?? Promise.resolve(0),
  ]);

  return NextResponse.json({
    leads: { total: totalLeads, byStatus: leadsByStatus },
    deals: { total: totalDeals, byStage: dealsByStage, totalValue: dealsByStage.reduce((sum, s) => sum + (s._sum.value || 0), 0) },
    contacts: { total: totalContacts },
    listings: { total: totalListings, byStatus: listingsByStatus },
    partners: { total: totalPartners, referralsByStatus },
    tasks: { open: openTasks, total: totalTasks },
    campaigns: { active: activeCampaigns },
    workflows: { active: activeWorkflows },
    recentActivity,
  });
}

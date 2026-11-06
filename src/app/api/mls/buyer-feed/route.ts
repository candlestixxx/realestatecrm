import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getActiveWorkspaceSlug } from '@/lib/workspace-context';
import { getMlsStatus } from '@/lib/mls-connection';

// Buyer feed for the calculator: every BUYER lead in the agent's workspace,
// their saved MLS search criteria (SearchAlert), and how many live listings
// match - so the agent can pull a buyer's real criteria into the numbers
// in one tap during the appointment. Requires the agent's MLS connection
// for live matching counts; without it, buyers still list (honest label).
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const slug = await getActiveWorkspaceSlug(session);
  const ws = await prisma.workspace.findUnique({ where: { slug } }).catch(() => null);
  const workspaceId = ws?.id || slug;
  const mls = await getMlsStatus(userId);

  const leads = await prisma.lead.findMany({
    where: { workspaceId, type: 'BUYER' },
    include: { contact: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const alerts = await prisma.searchAlert.findMany({
    where: { leadId: { in: leads.map((l) => l.id) }, isActive: true },
    orderBy: { createdAt: 'desc' },
  });
  const byLead = new Map<string, any>();
  for (const a of alerts) if (!byLead.has(a.leadId)) byLead.set(a.leadId, a);

  const buyers = [];
  for (const lead of leads) {
    let criteria: any = null;
    const alert = byLead.get(lead.id);
    if (alert) { try { criteria = JSON.parse(alert.criteria); } catch { criteria = null; } }
    let matchCount: number | null = null;
    if (criteria) {
      const where: any = { status: 'ACTIVE' };
      if (criteria.city) where.city = { contains: String(criteria.city) };
      if (criteria.minPrice) where.listPrice = { ...(where.listPrice || {}), gte: Number(criteria.minPrice) };
      if (criteria.maxPrice) where.listPrice = { ...(where.listPrice || {}), lte: Number(criteria.maxPrice) };
      if (criteria.beds) where.bedrooms = { gte: Number(criteria.beds) };
      if (criteria.baths) where.bathrooms = { gte: Number(criteria.baths) };
      matchCount = await prisma.listing.count({ where }).catch(() => null);
    }
    buyers.push({
      leadId: lead.id,
      name: lead.contact ? ((lead.contact.firstName || '') + ' ' + (lead.contact.lastName || '')).trim() || lead.contact.email || 'Buyer' : 'Buyer',
      status: lead.status,
      criteria,
      matchCount,
    });
  }
  return NextResponse.json({ mlsConnected: mls.connected, mlsStatus: mls.status, buyers });
}
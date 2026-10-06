import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEFAULT_WORKSPACE_SLUG } from '@/lib/workspace-context';

/**
 * Partner Permissions API
 * Per-partner access control for leads, deals, contacts, and referrals.
 * GET: fetch permissions for a partner (or all).
 * PUT: upsert permissions.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const partnerId = searchParams.get('partnerId');
  const workspaceId = searchParams.get('workspaceId') || DEFAULT_WORKSPACE_SLUG;

  const where: Record<string, unknown> = { workspaceId };
  if (partnerId) where.partnerId = partnerId;

  const permissions = await prisma.partnerPermission.findMany({
    where,
    include: {
      partner: { select: { id: true, companyName: true, contactName: true, type: true } },
    },
    take: 100,
  });

  return NextResponse.json({
    permissions: permissions.map(p => ({
      id: p.id,
      partnerId: p.partnerId,
      partnerName: p.partner?.contactName,
      partnerCompany: p.partner?.companyName,
      canViewLeads: p.canViewLeads,
      canViewDeals: p.canViewDeals,
      canViewContacts: p.canViewContacts,
      canCreateReferral: p.canCreateReferral,
      canEditReferral: p.canEditReferral,
    })),
  });
}

export async function PUT(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { partnerId, workspaceId, ...permissions } = body;
  if (!partnerId) {
    return NextResponse.json({ error: 'partnerId required' }, { status: 400 });
  }

  const wsId = workspaceId || DEFAULT_WORKSPACE_SLUG;
  const data: Record<string, unknown> = {};
  if (permissions.canViewLeads !== undefined) data.canViewLeads = !!permissions.canViewLeads;
  if (permissions.canViewDeals !== undefined) data.canViewDeals = !!permissions.canViewDeals;
  if (permissions.canViewContacts !== undefined) data.canViewContacts = !!permissions.canViewContacts;
  if (permissions.canCreateReferral !== undefined) data.canCreateReferral = !!permissions.canCreateReferral;
  if (permissions.canEditReferral !== undefined) data.canEditReferral = !!permissions.canEditReferral;

  const perm = await prisma.partnerPermission.upsert({
    where: { partnerId },
    update: data,
    create: {
      partnerId,
      workspaceId: wsId,
      ...data,
    },
  });

  return NextResponse.json({ id: perm.id, saved: true });
}

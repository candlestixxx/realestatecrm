import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');
  const status = searchParams.get('status');

  const referrals = await prisma.referral.findMany({
    where: {
      ...(workspaceId && { workspaceId }),
      ...(status && { status }),
    },
    include: { partner: true, lead: { include: { contact: true } }, deal: true, contact: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(referrals);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type, partnerId, leadId, dealId, contactId, commissionRate, notes, workspaceId } = body;

  if (!type || !partnerId || !workspaceId) {
    return NextResponse.json({ error: 'type, partnerId, workspaceId required' }, { status: 400 });
  }

  const referral = await prisma.referral.create({
    data: { type, partnerId, leadId, dealId, contactId, commissionRate, notes, workspaceId },
  });
  return NextResponse.json(referral, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, status, commissionRate, notes } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const referral = await prisma.referral.update({
    where: { id },
    data: { ...(status && { status }), ...(commissionRate !== undefined && { commissionRate }), ...(notes && { notes }) },
  });
  return NextResponse.json(referral);
}

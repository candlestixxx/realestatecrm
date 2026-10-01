import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listingId');
  const status = searchParams.get('status');

  const offers = await prisma.offer.findMany({
    where: {
      ...(listingId && { listingId }),
      ...(status && { status }),
    },
    include: { listing: true, buyer: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(offers);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { amount, listingId, buyerContactId, agentId, contingencies, closingDate, earnestMoney, notes, workspaceId } = body;

  if (!amount || !listingId || !buyerContactId || !workspaceId) {
    return NextResponse.json({ error: 'amount, listingId, buyerContactId, workspaceId required' }, { status: 400 });
  }

  const offer = await prisma.offer.create({
    data: {
      amount, listingId, buyerContactId, agentId,
      contingencies: contingencies ? JSON.stringify(contingencies) : null,
      closingDate: closingDate ? new Date(closingDate) : null,
      earnestMoney, notes, workspaceId,
    },
  });
  return NextResponse.json(offer, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, status, notes, closingDate, earnestMoney } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const offer = await prisma.offer.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(notes && { notes }),
      ...(closingDate && { closingDate: new Date(closingDate) }),
      ...(earnestMoney !== undefined && { earnestMoney }),
    },
  });
  return NextResponse.json(offer);
}

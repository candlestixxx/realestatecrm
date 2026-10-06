import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');
  const type = searchParams.get('type');

  const partners = await prisma.partner.findMany({
    where: {
      ...(workspaceId && { workspaceId }),
      ...(type && { type }),
      isActive: true,
    },
    include: { referrals: true, permissions: true },
    orderBy: { companyName: 'asc' },
  });
  return NextResponse.json(partners);
}

export async function POST(request: NextRequest) {
  let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  const { companyName, contactName, email, phone, type, licenseNumber, address, website, notes, workspaceId } = body;

  if (!companyName || !type || !workspaceId) {
    return NextResponse.json({ error: 'companyName, type, workspaceId required' }, { status: 400 });
  }

  const partner = await prisma.partner.create({
    data: { companyName, contactName, email, phone, type, licenseNumber, address, website, notes, workspaceId },
  });
  return NextResponse.json(partner, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const existing = await prisma.partner.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
  await prisma.partner.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}

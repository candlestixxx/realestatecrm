import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Deal Stakeholders API
 * Track who is involved in a deal (title, lender, inspector, appraiser, client).
 * GET: list stakeholders for a deal.
 * POST: add a stakeholder.
 * PUT: update stakeholder role/permissions.
 * DELETE: remove a stakeholder.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dealId = searchParams.get('dealId');
  if (!dealId) {
    return NextResponse.json({ error: 'dealId required' }, { status: 400 });
  }

  const stakeholders = await prisma.dealStakeholder.findMany({
    where: { dealId },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({
    stakeholders: stakeholders.map(s => ({
      id: s.id,
      dealId: s.dealId,
      role: s.role,
      permissions: s.permissions,
      contact: s.contact,
      user: s.user,
    })),
  });
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { dealId, contactId, userId, role, permissions } = body;
  if (!dealId || !role) {
    return NextResponse.json({ error: 'dealId and role required' }, { status: 400 });
  }

  const stakeholder = await prisma.dealStakeholder.create({
    data: {
      dealId,
      contactId: contactId || null,
      userId: userId || null,
      role,
      permissions: permissions || 'VIEW_STATUS',
    },
  });

  return NextResponse.json({ id: stakeholder.id, created: true }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { id, role, permissions, contactId, userId } = body;
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (role !== undefined) data.role = role;
  if (permissions !== undefined) data.permissions = permissions;
  if (contactId !== undefined) data.contactId = contactId;
  if (userId !== undefined) data.userId = userId;

  const stakeholder = await prisma.dealStakeholder.update({ where: { id }, data });
  return NextResponse.json({ id: stakeholder.id, updated: true });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  await prisma.dealStakeholder.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Deal Requirements API
 * Track closing requirements (title, inspection, appraisal, etc.) per deal.
 * GET: list requirements for a deal.
 * POST: add a requirement.
 * PUT: update requirement status.
 * DELETE: remove a requirement.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dealId = searchParams.get('dealId');
  if (!dealId) {
    return NextResponse.json({ error: 'dealId required' }, { status: 400 });
  }

  const requirements = await prisma.dealRequirement.findMany({
    where: { dealId },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ requirements });
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { dealId, title, description, status, assignedTo, isRequired } = body;
  if (!dealId || !title) {
    return NextResponse.json({ error: 'dealId and title required' }, { status: 400 });
  }

  // FK validation — dealId must reference an existing Deal or Prisma throws P2003 → 500
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
  }

  const req = await prisma.dealRequirement.create({
    data: {
      dealId,
      title,
      description: description || null,
      status: status || 'PENDING',
      assignedTo: assignedTo || null,
      isRequired: isRequired !== false,
    },
  });

  return NextResponse.json({ id: req.id, created: true }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { id, status, title, description, assignedTo, isRequired } = body;
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (status !== undefined) data.status = status;
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (assignedTo !== undefined) data.assignedTo = assignedTo;
  if (isRequired !== undefined) data.isRequired = isRequired;

  const req = await prisma.dealRequirement.update({ where: { id }, data });
  return NextResponse.json({ id: req.id, updated: true });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  await prisma.dealRequirement.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}

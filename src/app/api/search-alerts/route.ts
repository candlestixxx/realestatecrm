import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Search Alerts API
 * Saved property search alerts tied to leads (MLS-style notifications).
 * GET: list alerts (optionally by leadId).
 * POST: create a new alert.
 * DELETE: remove an alert.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get('leadId');
  const activeOnly = searchParams.get('active') === 'true';

  const where: Record<string, unknown> = {};
  if (leadId) where.leadId = leadId;
  if (activeOnly) where.isActive = true;

  const alerts = await prisma.searchAlert.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      lead: {
        select: {
          id: true,
          contact: { select: { firstName: true, lastName: true, email: true } },
        },
      },
    },
    take: 100,
  });

  return NextResponse.json({
    alerts: alerts.map(a => ({
      id: a.id,
      leadId: a.leadId,
      leadName: a.lead?.contact
        ? a.lead.contact.firstName + ' ' + a.lead.contact.lastName
        : 'Unknown',
      criteria: JSON.parse(a.criteria),
      type: a.type,
      frequency: a.frequency,
      isActive: a.isActive,
      createdAt: a.createdAt,
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

  const { leadId, criteria, type, frequency } = body;
  if (!leadId || !criteria) {
    return NextResponse.json({ error: 'leadId and criteria required' }, { status: 400 });
  }

  const alert = await prisma.searchAlert.create({
    data: {
      leadId,
      criteria: typeof criteria === 'string' ? criteria : JSON.stringify(criteria),
      type: type || 'VIEW',
      frequency: frequency || 'DAILY',
    },
  });

  return NextResponse.json({ id: alert.id, created: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  await prisma.searchAlert.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}

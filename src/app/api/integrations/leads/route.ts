import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { syncLeadToVectorStore } from '@/lib/rag';

/**
 * Data → CRM Integration (Skip-Trace / LegacyLeads)
 * Feeds skip-traced leads from legacyleads into the main CRM.
 *
 * Auth: `Authorization: Bearer <INTEGRATION_TOKEN>`
 * Payload: { firstName, lastName, email, phone, altPhone, address, city, state, zip, skipTraceData, source, score, tags, leadType, workspaceId }
 */
export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization');
  const token = process.env.INTEGRATION_TOKEN || process.env.VOICE_WEBHOOK_TOKEN;
  if (!token || auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      firstName, lastName, email, phone, altPhone, address, city, state, zip,
      skipTraceData, source, score, tags, workspaceId, leadType,
    } = body;

    if (!firstName) {
      return NextResponse.json({ error: 'firstName required' }, { status: 400 });
    }

    const workspace = workspaceId
      ? await prisma.workspace.findUnique({ where: { id: workspaceId } })
      : await prisma.workspace.findFirst({ orderBy: { createdAt: 'asc' } });

    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
    }

    const fullAddress = [address, city, state, zip].filter(Boolean).join(', ');

    let contact = await prisma.contact.findFirst({
      where: {
        workspaceId: workspace.id,
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          firstName,
          lastName: lastName || null,
          email: email || null,
          phone: phone || null,
          address: fullAddress || null,
          additionalPhones: altPhone ? JSON.stringify([altPhone]) : null,
          workspaceId: workspace.id,
        },
      });
    }

    const lead = await prisma.lead.create({
      data: {
        type: leadType || 'SELLER',
        source: source || 'Skip Trace',
        status: 'NEW',
        score: score || 50,
        isAiAssisted: true,
        tags: tags || '#skip-trace',
        workspaceId: workspace.id,
        contactId: contact.id,
        publicRecords: skipTraceData ? JSON.stringify(skipTraceData) : null,
        lastEnrichedAt: new Date(),
      },
    });

    await prisma.activity.create({
      data: {
        type: 'NOTE',
        content: `Skip-traced lead imported from ${source || 'LegacyLeads'}${skipTraceData ? ' — enrichment data attached' : ''}`,
        workspaceId: workspace.id,
        contactId: contact.id,
        leadId: lead.id,
        metadata: JSON.stringify({ source: 'legacyleads', skipTrace: !!skipTraceData }),
      },
    });

    try {
      await syncLeadToVectorStore(lead, contact);
    } catch (e) { /* non-critical */ }

    return NextResponse.json({ success: true, contactId: contact.id, leadId: lead.id });
  } catch (error: any) {
    console.error('Leads integration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

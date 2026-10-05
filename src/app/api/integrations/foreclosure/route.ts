import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { syncLeadToVectorStore } from '@/lib/rag';

/**
 * Foreclosure → CRM Integration
 * Imports foreclosure leads from forclosureworkflow into the main CRM pipeline.
 *
 * Auth: `Authorization: Bearer <INTEGRATION_TOKEN>`
 * Payload: { firstName, lastName, email, phone, address, city, state, zip, filingType, filingDate, auctionDate, loanAmount, estimatedValue, source, workspaceId }
 */
export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization');
  const token = process.env.INTEGRATION_TOKEN || process.env.VOICE_WEBHOOK_TOKEN;
  if (!token || auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const {
      firstName, lastName, email, phone, address, city, state, zip,
      filingType, filingDate, auctionDate, loanAmount, estimatedValue,
      source, workspaceId,
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
          workspaceId: workspace.id,
        },
      });
    }

    const lead = await prisma.lead.create({
      data: {
        type: 'SELLER',
        source: source || 'Foreclosure',
        status: 'NEW',
        score: 75,
        isAiAssisted: true,
        tags: '#foreclosure,#pre-foreclosure',
        workspaceId: workspace.id,
        contactId: contact.id,
        publicRecords: JSON.stringify({
          filingType: filingType || 'NOTICE_OF_DEFAULT',
          filingDate: filingDate || null,
          auctionDate: auctionDate || null,
          loanAmount: loanAmount || null,
          estimatedValue: estimatedValue || null,
          address: fullAddress,
        }),
      },
    });

    const detailParts = [
      filingType || 'NOD',
      filingDate ? 'filed ' + filingDate : null,
      auctionDate ? 'auction ' + auctionDate : null,
      estimatedValue ? 'est. value $' + estimatedValue : null,
    ].filter(Boolean);
    const detailStr = detailParts.join(', ');

    await prisma.activity.create({
      data: {
        type: 'NOTE',
        content: 'Foreclosure lead imported: ' + detailStr,
        workspaceId: workspace.id,
        contactId: contact.id,
        leadId: lead.id,
        metadata: JSON.stringify({ source: 'foreclosureworkflow', filingType, auctionDate }),
      },
    });

    try {
      await syncLeadToVectorStore(lead, contact);
    } catch (e) { /* non-critical */ }

    return NextResponse.json({ success: true, contactId: contact.id, leadId: lead.id });
  } catch (error: any) {
    console.error('Foreclosure integration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

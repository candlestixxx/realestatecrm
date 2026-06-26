import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { syncContactToVectorStore, syncLeadToVectorStore } from '@/lib/rag';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  try {
    const body = await req.json();

    // Default workspace
    const workspace = await prisma.workspace.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!workspace) {
      return NextResponse.json({ success: false, error: 'No workspace found.' }, { status: 500 });
    }

    let firstName = 'New';
    let lastName = 'Lead';
    let email = '';
    let phone = '';
    let notes = '';
    let type: 'BUYER' | 'SELLER' = 'BUYER';
    let source = `${provider.toUpperCase()} Integration`;
    let address = '';

    if (provider === 'zillow') {
      const contact = body.contact || {};
      const nameParts = (contact.name || 'Zillow User').trim().split(' ');
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ') || 'Lead';
      email = contact.email || '';
      phone = contact.phone || '';
      notes = body.message || `Zillow inquiry for property: ${body.property?.address || 'unknown'}`;
      address = body.property?.address || '';
      type = 'BUYER';
      source = 'Zillow Profile';
    } else if (provider === 'realtor') {
      const lead = body.lead || {};
      const contact = lead.contact || {};
      const nameParts = (contact.fullName || 'Realtor User').trim().split(' ');
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ') || 'Lead';
      email = contact.email || '';
      phone = contact.phone || '';
      notes = lead.inquiryDetails || 'Realtor.com Profile Lead';
      type = 'BUYER';
      source = 'Realtor.com Profile';
    } else if (provider === 'homes') {
      const contact = body.contact || {};
      const nameParts = (contact.name || 'Homes.com User').trim().split(' ');
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ') || 'Lead';
      email = contact.email || '';
      phone = contact.phone || '';
      notes = body.message || 'Homes.com Lead';
      type = 'BUYER';
      source = 'Homes.com Profile';
    } else if (provider === 'myplus') {
      firstName = body.firstName || 'MyPlus';
      lastName = body.lastName || 'Lead';
      email = body.email || '';
      phone = body.phone || '';
      notes = body.notes || `Pre-foreclosure record: ${body.address || ''}`;
      address = body.address || '';
      type = 'SELLER';
      source = 'MyPlusLeads';
    } else {
      firstName = body.firstName || 'External';
      lastName = body.lastName || 'Lead';
      email = body.email || '';
      phone = body.phone || '';
      notes = body.notes || 'Direct API integration import';
      source = body.source || `${provider} Webhook`;
    }

    // Create the Contact
    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName: lastName || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        workspaceId: workspace.id,
      },
    });

    // Create the Lead
    const lead = await prisma.lead.create({
      data: {
        status: 'NEW',
        score: 80,
        source,
        type,
        workspaceId: workspace.id,
        contactId: contact.id,
      },
    });

    // Log the message as a Note
    if (notes) {
      await prisma.activity.create({
        data: {
          type: 'NOTE',
          content: `Inbound Webhook Intake:\n"${notes}"`,
          workspaceId: workspace.id,
          leadId: lead.id,
        },
      });
    }

    // Sync to vector store
    await Promise.all([
      syncContactToVectorStore(contact),
      syncLeadToVectorStore(lead, contact),
    ]);

    return NextResponse.json({ success: true, leadId: lead.id });
  } catch (err: any) {
    console.error(`Failed to ingest lead via ${provider} webhook:`, err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

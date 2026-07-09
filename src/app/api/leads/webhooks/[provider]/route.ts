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

    // Auto-associate with Segments based on lead listing type/status
    const textToMatch = `${body.listingType || ''} ${body.status || ''} ${body.type || ''} ${body.notes || ''}`.toLowerCase();
    let segmentName = '';
    if (textToMatch.includes('expired')) {
      segmentName = 'Expired';
    } else if (textToMatch.includes('cancel') || textToMatch.includes('canceld')) {
      segmentName = 'Canceled';
    } else if (textToMatch.includes('fsbo')) {
      segmentName = 'FSBO';
    }

    if (segmentName) {
      // Find or create the segment in this workspace
      let segment = await prisma.segment.findFirst({
        where: {
          workspaceId: workspace.id,
          name: segmentName,
        },
      });

      if (!segment) {
        segment = await prisma.segment.create({
          data: {
            name: segmentName,
            description: `Automated webhook segment for ${segmentName} listings.`,
            workspaceId: workspace.id,
          },
        });
      }

      // Connect the lead to the segment
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          segments: {
            connect: { id: segment.id },
          },
        },
      });
    }

    // Retrieve workspace members to notify them via email
    try {
      const workspaceMembers = await prisma.workspaceMember.findMany({
        where: { workspaceId: workspace.id },
        include: { user: true },
      });

      const emailsToNotify = workspaceMembers
        .map((member) => member.user.email)
        .filter((email): email is string => !!email);

      if (emailsToNotify.length > 0) {
        const { sendMail } = await import('@/lib/email-config');
        const leadName = `${firstName} ${lastName || ''}`.trim();
        const mailSubject = `🔔 New Inbound Lead: ${leadName} (${segmentName || 'Unassigned'})`;
        const mailContent = `
A new lead has been automatically ingested from MyPlusLeads.

Lead Profile:
- Name: ${leadName}
- Phone: ${phone || 'N/A'}
- Email: ${email || 'N/A'}
- Address: ${address || 'N/A'}
- Listing Type/Segment: ${segmentName || 'General Intake'}

View your leads dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/leads
        `.trim();

        // Send email notifications to workspace members asynchronously
        Promise.all(
          emailsToNotify.map((recipient) =>
            sendMail({ to: recipient, subject: mailSubject, message: mailContent })
          )
        ).catch((err) => console.error('Failed to dispatch webhook intake emails:', err));
      }
    } catch (e) {
      console.error('Failed to notify workspace members of new lead:', e);
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

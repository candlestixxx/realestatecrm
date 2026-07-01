import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { syncContactToVectorStore, syncLeadToVectorStore } from '@/lib/rag';
import { routeLeadAction } from '@/lib/routing';

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

    let additionalPhones: string | null = null;
    let spouseName: string | null = null;
    let spousePhone: string | null = null;
    let spouseEmail: string | null = null;
    let listingIdTag: string | null = null;

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
      const streetName = body.propertyAddress?.streetAddress || body.address || '';
      const fallbackName = streetName ? `Owner of ${streetName}` : 'Unknown';
      const nameParts = (body.owner?.name || body.contact1?.name || fallbackName).split(' ');
      firstName = body.owner?.firstName || nameParts[0] || 'MyPlus';
      lastName = body.owner?.lastName || nameParts.slice(1).join(' ') || 'Lead';
      email = body.contact1?.email || body.email || '';
      address = streetName;
      type = 'SELLER';
      source = 'MyPlusLeads';

      // Parse multiple numbers
      const p1 = body.contact1?.phone1 || body.phone || '';
      const p2 = body.contact1?.phone2 || '';
      const p3 = body.contact1?.phone3 || '';
      const o1 = body.owner?.phone1 || '';
      const o2 = body.owner?.phone2 || '';
      const o3 = body.owner?.phone3 || '';
      const c2p1 = body.contact2?.phone1 || '';
      const c2p2 = body.contact2?.phone2 || '';

      const rawUniquePhones = Array.from(new Set([p1, p2, p3, o1, o2, o3, c2p1, c2p2].filter(Boolean)));
      phone = rawUniquePhones[0] || '';
      const altPhones = rawUniquePhones.slice(1).map((val, idx) => ({
        value: val,
        label: idx === 0 ? 'Cell Phone 2' : idx === 1 ? 'Landline' : 'Work Phone'
      }));
      additionalPhones = altPhones.length > 0 ? JSON.stringify(altPhones) : null;

      // Gather spouse details
      spouseName = body.contact2?.name || null;
      spousePhone = body.contact2?.phone1 || null;
      spouseEmail = body.contact2?.email || null;
      listingIdTag = body.listingId ? `id:${body.listingId}` : null;

      // Extract remarks
      const remarks = body.remarks || body.notes || '';
      let notesContent = '';
      if (remarks) {
        notesContent += `Remarks: ${remarks}\n\n`;
      }
      if (body.listDate) {
        notesContent += `List Date: ${body.listDate}\n`;
      }
      if (body.price) {
        notesContent += `Listing Price: $${body.price}\n`;
      }
      notes = notesContent.trim() || `MyPlusLeads webhook intake: ${address}`;
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
        additionalPhones,
        spouseName,
        spousePhone,
        spouseEmail,
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
        tags: listingIdTag,
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

    // Route the lead using round-robin team assignment rules
    try {
      await routeLeadAction(lead.id);
    } catch (routingErr) {
      console.error(`[Lead Routing] Error routing webhook lead ${lead.id}:`, routingErr);
    }

    return NextResponse.json({ success: true, leadId: lead.id });
  } catch (err: any) {
    console.error(`Failed to ingest lead via ${provider} webhook:`, err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

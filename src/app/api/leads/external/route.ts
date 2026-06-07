import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { syncContactToVectorStore, syncLeadToVectorStore } from '@/lib/rag';

export async function POST(req: Request) {
  try {
    const { name, email, phone, notes, assignedAgentEmail, source } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ success: false, error: 'Name and email are required.' }, { status: 400 });
    }

    // Default workspace
    const workspace = await prisma.workspace.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!workspace) {
      return NextResponse.json({ success: false, error: 'No workspace found.' }, { status: 500 });
    }

    // Find the assigned agent by email
    const agent = await prisma.user.findFirst({
      where: { email: assignedAgentEmail },
    });

    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create the Contact
    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName: lastName || null,
        email: email || null,
        phone: phone || null,
        workspaceId: workspace.id,
      },
    });

    // Create the Lead and assign to the agent (userId)
    const lead = await prisma.lead.create({
      data: {
        status: 'NEW',
        score: 70,
        source: source || 'Agent Website',
        type: 'BUYER',
        workspaceId: workspace.id,
        contactId: contact.id,
        userId: agent ? agent.id : null,
      },
    });

    // Log the message as a Note
    if (notes) {
      await prisma.activity.create({
        data: {
          type: 'NOTE',
          content: `Web Inquiry from Agent Site:\n"${notes}"`,
          workspaceId: workspace.id,
          userId: agent ? agent.id : null,
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
    console.error('Failed to register external lead:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
  }
}

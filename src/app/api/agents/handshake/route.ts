import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agentName, token, action, payload } = body;

    // Simple authentication handshake (accepting a mock or sandbox token)
    const isAuthorized = !process.env.AGENT_SECRET || token === process.env.AGENT_SECRET;
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized agent signature.' }, { status: 401 });
    }

    console.log(`[Agent Handshake] Connected agent: ${agentName || 'Unknown'} executing action: ${action}`);

    // Process actions matching Hermes and OpenClaw protocol requirements
    switch (action) {
      case 'GET_LATEST_LEADS':
        const leads = await prisma.lead.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { contact: true }
        });
        return NextResponse.json({ success: true, leads });

      case 'CREATE_INBOUND_LEAD':
        if (!payload || !payload.firstName || !payload.email) {
          return NextResponse.json({ error: 'Missing lead fields (firstName, email)' }, { status: 400 });
        }
        
        // Find default workspace
        const workspaces = await prisma.workspace.findMany({ take: 1 });
        const workspaceId = workspaces[0]?.id || 'default';

        const contact = await prisma.contact.create({
          data: {
            firstName: payload.firstName,
            lastName: payload.lastName || null,
            email: payload.email,
            phone: payload.phone || null,
            address: payload.address || null,
            workspaceId
          }
        });

        const newLead = await prisma.lead.create({
          data: {
            type: payload.type || 'BUYER',
            source: agentName ? `${agentName} Agent Integration` : 'External Agent Portal',
            status: 'NEW',
            workspaceId,
            contactId: contact.id
          }
        });

        return NextResponse.json({ success: true, leadId: newLead.id, contactId: contact.id });

      case 'TRIGGER_SMART_PLAN':
        if (!payload || !payload.leadId || !payload.campaignId) {
          return NextResponse.json({ error: 'Missing leadId or campaignId' }, { status: 400 });
        }
        // Mock success for campaign enrollments triggered by external agents
        return NextResponse.json({ success: true, message: `Lead ${payload.leadId} successfully enrolled in Campaign ${payload.campaignId}` });

      default:
        return NextResponse.json({ error: `Unsupported agent action: ${action}` }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Agent Handshake Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

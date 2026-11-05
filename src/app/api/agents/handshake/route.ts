import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { agentName, token, action, payload } = body;

    // Agent authentication. AGENT_SECRET is REQUIRED in production — when
    // unset we reject instead of accepting arbitrary tokens (the previous
    // "accept if unset" behavior was effectively mock auth).
    if (!process.env.AGENT_SECRET) {
      return NextResponse.json(
        { error: 'Agent handshake unavailable: AGENT_SECRET is not configured.' },
        { status: 503 }
      );
    }
    if (token !== process.env.AGENT_SECRET) {
      return NextResponse.json({ error: 'Unauthorized agent signature.' }, { status: 401 });
    }

    // console.log(`[Agent Handshake] Connected agent: ${agentName || 'Unknown'} executing action: ${action}`);

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

      case 'TRIGGER_SMART_PLAN': {
        if (!payload || !payload.leadId || !payload.campaignId) {
          return NextResponse.json({ error: 'Missing leadId or campaignId' }, { status: 400 });
        }
        // Real enrollment — validate the lead exists, then create the
        // enrollment record. (This previously returned a fabricated success
        // message without enrolling anything.)
        const lead = await prisma.lead.findUnique({ where: { id: payload.leadId } });
        if (!lead) {
          return NextResponse.json({ error: `Lead ${payload.leadId} not found` }, { status: 404 });
        }
        const plan = await prisma.smartPlan.findUnique({ where: { id: payload.campaignId } });
        if (!plan) {
          return NextResponse.json({ error: `Campaign ${payload.campaignId} not found` }, { status: 404 });
        }
        await prisma.lead.update({
          where: { id: payload.leadId },
          data: { smartPlanId: payload.campaignId },
        });
        return NextResponse.json({ success: true, message: `Lead ${payload.leadId} enrolled in Campaign ${payload.campaignId}` });
      }

      default:
        return NextResponse.json({ error: `Unsupported agent action: ${action}` }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Agent Handshake Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

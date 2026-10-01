import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * AgentCore → Voice Trigger
 * Triggers a voice campaign on leadG (VoiceForge AI) from CRM workflows.
 *
 * Auth: `Authorization: Bearer <INTEGRATION_TOKEN>`
 * Payload: { leadId, campaignType, script, voiceId, workspaceId }
 */
export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization');
  const token = process.env.INTEGRATION_TOKEN || process.env.VOICE_WEBHOOK_TOKEN;
  if (!token || auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { leadId, campaignType, script, voiceId, workspaceId } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'leadId required' }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { contact: true },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const contactName = `${lead.contact.firstName} ${lead.contact.lastName || ''}`.trim();

    const voicePayload = {
      leadId: lead.id,
      contactName,
      phone: lead.contact.phone,
      email: lead.contact.email,
      campaignType: campaignType || 'OUTBOUND_FOLLOWUP',
      script: script || `Hi ${lead.contact.firstName}, this is an automated follow-up from Excel Legacy Realty Group.`,
      voiceId: voiceId || null,
      workspaceId: lead.workspaceId,
    };

    const voiceServiceUrl = process.env.VOICE_SERVICE_URL || 'http://localhost:3001';
    try {
      const resp = await fetch(`${voiceServiceUrl}/api/campaigns/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(voicePayload),
        signal: AbortSignal.timeout(10000),
      });

      const result = await resp.json().catch(() => ({}));

      await prisma.activity.create({
        data: {
          type: 'CALL',
          content: `Voice campaign triggered (${campaignType || 'OUTBOUND_FOLLOWUP'}) for ${contactName}`,
          workspaceId: lead.workspaceId,
          leadId: lead.id,
          contactId: lead.contactId,
          metadata: JSON.stringify({ source: 'agentcore', voiceServiceStatus: resp.status, result }),
        },
      });

      return NextResponse.json({ success: resp.ok, status: resp.status, result });
    } catch (fetchErr: any) {
      await prisma.activity.create({
        data: {
          type: 'NOTE',
          content: `Voice campaign trigger attempted but voice service unreachable: ${fetchErr.message}`,
          workspaceId: lead.workspaceId,
          leadId: lead.id,
          contactId: lead.contactId,
          metadata: JSON.stringify({ source: 'agentcore', error: fetchErr.message }),
        },
      });

      return NextResponse.json({ success: false, error: 'Voice service unreachable', details: fetchErr.message }, { status: 502 });
    }
  } catch (error: any) {
    console.error('Voice trigger error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

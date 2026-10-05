import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * AgentCore → Content Trigger
 * Requests content generation from contentplanner for a CRM lead/listing.
 *
 * Auth: `Authorization: Bearer <INTEGRATION_TOKEN>`
 * Payload: { leadId, dealId, contentType, prompt, platform, workspaceId }
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
    const { leadId, dealId, contentType, prompt, platform, workspaceId } = body;

    if (!leadId && !dealId) {
      return NextResponse.json({ error: 'leadId or dealId required' }, { status: 400 });
    }

    let context: any = { workspaceId };

    if (leadId) {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: { contact: true },
      });
      if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      context = {
        ...context,
        workspaceId: lead.workspaceId,
        leadId: lead.id,
        contactName: `${lead.contact.firstName} ${lead.contact.lastName || ''}`.trim(),
        email: lead.contact.email,
        leadType: lead.type,
        leadSource: lead.source,
        leadStatus: lead.status,
        tags: lead.tags,
      };
    }

    if (dealId) {
      const deal = await prisma.deal.findUnique({
        where: { id: dealId },
        include: { contact: true },
      });
      if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
      context = {
        ...context,
        workspaceId: context.workspaceId || deal.workspaceId,
        dealId: deal.id,
        dealTitle: deal.title,
        dealValue: deal.value,
        dealStage: deal.stage,
      };
    }

    const contentPayload = {
      type: contentType || 'social_post',
      platform: platform || 'facebook',
      prompt: prompt || `Generate a ${contentType || 'social post'} for ${context.contactName || context.dealTitle || 'our client'}`,
      context,
      workspaceId: context.workspaceId,
    };

    const contentServiceUrl = process.env.CONTENT_SERVICE_URL || 'http://localhost:3002';
    try {
      const resp = await fetch(`${contentServiceUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(contentPayload),
        signal: AbortSignal.timeout(30000),
      });

      const result = await resp.json().catch(() => ({}));

      await prisma.activity.create({
        data: {
          type: 'CONTENT_REQUESTED',
          content: `Content generation requested (${contentType || 'social_post'} for ${platform || 'facebook'})`,
          workspaceId: context.workspaceId,
          leadId: leadId || null,
          dealId: dealId || null,
          metadata: JSON.stringify({ source: 'agentcore', contentServiceStatus: resp.status, request: contentPayload }),
        },
      });

      return NextResponse.json({ success: resp.ok, status: resp.status, result });
    } catch (fetchErr: any) {
      await prisma.activity.create({
        data: {
          type: 'NOTE',
          content: `Content generation requested but content service unreachable: ${fetchErr.message}`,
          workspaceId: context.workspaceId,
          leadId: leadId || null,
          dealId: dealId || null,
          metadata: JSON.stringify({ source: 'agentcore', error: fetchErr.message }),
        },
      });

      return NextResponse.json({ success: false, error: 'Content service unreachable', details: fetchErr.message }, { status: 502 });
    }
  } catch (error: any) {
    console.error('Content trigger error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

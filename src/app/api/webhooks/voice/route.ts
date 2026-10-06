import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Voice → CRM Timeline Webhook
 * Receives call events from leadG (VoiceForge AI) and creates Activity timeline entries.
 *
 * Auth: `Authorization: Bearer <VOICE_WEBHOOK_TOKEN>` (shared secret).
 * Payload: { callId, direction, from, to, status, duration, transcript, summary, sentiment, outcome, leadEmail, leadPhone, timestamp }
 */
export async function POST(request: NextRequest) {
  // Verify shared secret
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.VOICE_WEBHOOK_TOKEN;
  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Invalid webhook token' }, { status: 401 });
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const {
      callId, direction, from, to, status, duration,
      transcript, summary, sentiment, outcome,
      leadEmail, leadPhone, workspaceId,
    } = body;

    if (!callId) {
      return NextResponse.json({ error: 'callId is required' }, { status: 400 });
    }

    // Find workspace (use provided or default)
    const workspace = workspaceId
      ? await prisma.workspace.findUnique({ where: { id: workspaceId } })
      : await prisma.workspace.findFirst({ orderBy: { createdAt: 'asc' } });

    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
    }

    // Find matching contact by phone or email
    let contact = null;
    if (leadPhone) {
      contact = await prisma.contact.findFirst({
        where: { workspaceId: workspace.id, phone: leadPhone },
      });
    }
    if (!contact && leadEmail) {
      contact = await prisma.contact.findFirst({
        where: { workspaceId: workspace.id, email: leadEmail },
      });
    }

    // Find matching lead through contact
    let lead = null;
    if (contact) {
      lead = await prisma.lead.findFirst({
        where: { workspaceId: workspace.id, contactId: contact.id },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Build activity content
    const directionLabel = direction === 'outbound' ? 'Outbound' : 'Inbound';
    const durationLabel = duration ? ` (${Math.floor(duration / 60)}m ${duration % 60}s)` : '';

    let content = `📞 ${directionLabel} voice call${durationLabel} — ${status || 'completed'}`;
    if (summary) content += `\n\nSummary: ${summary}`;
    if (transcript) content += `\n\nTranscript excerpt: ${transcript.slice(0, 500)}${transcript.length > 500 ? '...' : ''}`;
    if (outcome) content += `\nOutcome: ${outcome}`;

    // Store metadata for filtering/analysis
    const metadata = JSON.stringify({
      source: 'voice-agent',
      callId,
      direction,
      from,
      to,
      status,
      duration,
      sentiment,
      outcome,
    });

    // Create activity entry
    const activity = await prisma.activity.create({
      data: {
        type: 'CALL',
        content,
        metadata,
        workspaceId: workspace.id,
        ...(lead && { leadId: lead.id }),
        ...(contact && { contactId: contact.id }),
      },
    });

    // If sentiment is negative, flag the lead
    if (sentiment !== undefined && sentiment < -0.3 && lead) {
      try {
        const currentTags = lead.tags || '';
        const tagList = currentTags ? currentTags.split(',').map(t => t.trim()) : [];
        if (!tagList.includes('negative-call')) {
          tagList.push('negative-call');
          await prisma.lead.updateMany({
            where: { id: lead.id },
            data: { tags: tagList.join(',') },
          });
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      activityId: activity.id,
      matchedContact: contact?.id || null,
      matchedLead: lead?.id || null,
    });
  } catch (error) {
    console.error('Voice webhook error:', error);
    return NextResponse.json({ error: 'Failed to process voice webhook' }, { status: 500 });
  }
}

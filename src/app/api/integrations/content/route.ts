import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Content → CRM Integration
 * Receives published content events from contentplanner and links them to CRM leads/contacts.
 *
 * Auth: Authorization: Bearer <INTEGRATION_TOKEN>
 * Payload: { type, title, body, platform, leadEmail, leadPhone, workspaceId, scheduledAt, publishedAt }
 */
export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization');
  const token = process.env.INTEGRATION_TOKEN || process.env.VOICE_WEBHOOK_TOKEN;
  const expected = 'Bearer ' + token;
  if (!token || auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, title, body: contentBody, platform, leadEmail, leadPhone, workspaceId, publishedAt } = body;

    if (!title && !contentBody) {
      return NextResponse.json({ error: 'title or body required' }, { status: 400 });
    }

    const workspace = workspaceId
      ? await prisma.workspace.findUnique({ where: { id: workspaceId } })
      : await prisma.workspace.findFirst({ orderBy: { createdAt: 'asc' } });

    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
    }

    let contact = null;
    if (leadPhone) {
      contact = await prisma.contact.findFirst({ where: { workspaceId: workspace.id, phone: leadPhone } });
    }
    if (!contact && leadEmail) {
      contact = await prisma.contact.findFirst({ where: { workspaceId: workspace.id, email: leadEmail } });
    }

    let lead = null;
    if (contact) {
      lead = await prisma.lead.findFirst({ where: { contactId: contact.id, workspaceId: workspace.id } });
    }

    const summary = (title || 'Content published') + (contentBody ? ': ' + contentBody.substring(0, 200) : '');
    const prefix = '[' + (platform || 'Social') + '] ';

    const activity = await prisma.activity.create({
      data: {
        type: 'CONTENT_PUBLISHED',
        content: prefix + summary,
        workspaceId: workspace.id,
        contactId: contact?.id || null,
        leadId: lead?.id || null,
        metadata: JSON.stringify({ platform, publishedAt: publishedAt || new Date().toISOString(), source: 'contentplanner' }),
      },
    });

    return NextResponse.json({ success: true, activityId: activity.id, contactId: contact?.id, leadId: lead?.id });
  } catch (error: any) {
    console.error('Content integration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

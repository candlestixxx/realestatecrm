import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Media → CRM Integration
 * Receives media pipeline events from media-workflow and updates CRM records.
 *
 * Auth: `Authorization: Bearer <INTEGRATION_TOKEN>`
 * Payload: { event, listingId, assets[], status, contactId, leadId, dealId, workspaceId, metadata }
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
    const { event, listingId, assets, status, contactId, leadId, dealId, workspaceId, metadata } = body;

    const workspace = workspaceId
      ? await prisma.workspace.findUnique({ where: { id: workspaceId } })
      : await prisma.workspace.findFirst({ orderBy: { createdAt: 'asc' } });

    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
    }

    const eventLabels: Record<string, string> = {
      photos_imported: 'Property photos imported',
      video_generated: 'Promotional video generated',
      virtual_tour_created: 'Virtual tour created',
      media_processed: 'Media assets processed',
      export_completed: 'Media export completed',
    };

    const label = eventLabels[event] || `Media event: ${event}`;
    const assetCount = assets?.length ? ` (${assets.length} assets)` : '';
    const statusSuffix = status ? ` — ${status}` : '';

    const activity = await prisma.activity.create({
      data: {
        type: 'MEDIA',
        content: `${label}${assetCount}${statusSuffix}`,
        workspaceId: workspace.id,
        contactId: contactId || null,
        leadId: leadId || null,
        dealId: dealId || null,
        metadata: JSON.stringify({ source: 'media-workflow', event, listingId, assets: assets?.slice(0, 5), ...metadata }),
      },
    });

    return NextResponse.json({ success: true, activityId: activity.id });
  } catch (error: any) {
    console.error('Media integration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

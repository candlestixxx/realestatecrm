import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import {
  getSyncQueue,
  getQueueStats,
  addLeadsToSyncQueue,
  updateSyncItem,
  skipSyncItem,
  markSynced,
  markFailed,
  getNextQueued,
} from '@/lib/integrations/sync-queue';
import { buildSyncPlan } from '@/lib/integrations/myplus';
import { searchLoftyContactStrict, verifyLeadInLofty } from '@/lib/integrations/lofty';
import { buildIntegrationReadiness } from '@/lib/integrations/sync-workflow';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/sync-queue — List all items in the sync queue + stats + readiness
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  await requireWorkspaceAccess(session);

  const [items, stats] = await Promise.all([getSyncQueue(), getQueueStats()]);

  return NextResponse.json({
    items,
    stats,
    readiness: buildIntegrationReadiness({
      hasLoftyApiKey: Boolean(process.env.LOFTY_API_KEY?.trim()),
      myplusIntegrationConfirmed: false,
    }),
  });
}

/**
 * POST /api/sync-queue — Actions:
 *   { action: "enqueue" }                    — enqueue all unsynced preforeclosure leads
 *   { action: "enqueueLeads", leadIds: [] }  — enqueue specific leads
 *   { action: "next" }                       — get next queued item + sync plan
 *   { action: "startSync", id: "" }          — mark item as FINDING (opening in MyPlus)
 *   { action: "completeSync", id: "", loftyContactId: "" } — mark synced
 *   { action: "verifyLoftyKey", apiKey?: "", query?: "" } — test Lofty v1.0 lead search
 *   { action: "verifyLead", id: "", apiKey?: "" } — confirm active lead exists in Lofty
 *   { action: "failSync", id: "", error: "" } — mark failed
 *   { action: "skip", id: "" }               — skip this lead
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);
  const body = await req.json();
  const { action } = body;

  switch (action) {
    // ─── Enqueue all unsynced preforeclosure leads ────────────────────────
    case 'enqueue': {
      const leads = await prisma.lead.findMany({
        where: {
          workspaceId: access.workspaceId,
          status: 'PREFORECLOSURE',
        },
        include: { contact: true, user: true },
      });

      const items = leads.map((lead) => ({
        leadId: lead.id,
        contactId: lead.contactId,
        firstName: lead.contact.firstName,
        lastName: lead.contact.lastName ?? '',
        email: lead.contact.email,
        phone: lead.contact.phone,
        source: lead.source,
        assignedAgent: lead.user?.name ?? null,
      }));

      const result = await addLeadsToSyncQueue(items);
      return NextResponse.json({ ...result, queueStats: await getQueueStats() });
    }

    // ─── Enqueue specific leads ───────────────────────────────────────────
    case 'enqueueLeads': {
      const { leadIds } = body as { leadIds: string[] };
      if (!leadIds?.length) {
        return NextResponse.json({ error: 'leadIds required' }, { status: 400 });
      }

      const leads = await prisma.lead.findMany({
        where: { id: { in: leadIds }, workspaceId: access.workspaceId },
        include: { contact: true, user: true },
      });

      const items = leads.map((lead) => ({
        leadId: lead.id,
        contactId: lead.contactId,
        firstName: lead.contact.firstName,
        lastName: lead.contact.lastName ?? '',
        email: lead.contact.email,
        phone: lead.contact.phone,
        source: lead.source,
        assignedAgent: lead.user?.name ?? null,
      }));

      const result = await addLeadsToSyncQueue(items);
      return NextResponse.json({ ...result, queueStats: await getQueueStats() });
    }

    // ─── Get next queued item with portal sync plan ───────────────────────
    case 'next': {
      const next = await getNextQueued();
      if (!next) {
        return NextResponse.json({ item: null, plan: null });
      }
      const plan = buildSyncPlan(next.firstName, next.lastName);
      return NextResponse.json({ item: next, plan });
    }

    // ─── Start sync (mark as finding in MyPlus portal) ───────────────────
    case 'startSync': {
      const { id } = body as { id: string };
      const updated = await updateSyncItem(id, { status: 'FINDING' });
      if (!updated) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      return NextResponse.json({ item: updated });
    }

    // ─── Complete sync ────────────────────────────────────────────────────
    case 'completeSync': {
      const { id, loftyContactId } = body as { id: string; loftyContactId: string };
      const updated = await markSynced(id, loftyContactId);
      if (!updated) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      return NextResponse.json({ item: updated, queueStats: await getQueueStats() });
    }

    // ─── Verify Lofty API key / query ─────────────────────────────────────
    case 'verifyLoftyKey': {
      const { apiKey, query, myplusIntegrationConfirmed } = body as {
        apiKey?: string;
        query?: string;
        myplusIntegrationConfirmed?: boolean;
      };
      const key = apiKey?.trim() || process.env.LOFTY_API_KEY?.trim();
      if (!key) {
        return NextResponse.json(
          { ok: false, error: 'Fresh Lofty API key is required.' },
          { status: 400 },
        );
      }

      try {
        const results = await searchLoftyContactStrict(key, query?.trim() || 'test');
        return NextResponse.json({
          ok: true,
          resultCount: results.length,
          sample: results.slice(0, 3),
          readiness: buildIntegrationReadiness({
            hasLoftyApiKey: true,
            myplusIntegrationConfirmed: Boolean(myplusIntegrationConfirmed),
          }),
        });
      } catch (error) {
        return NextResponse.json(
          {
            ok: false,
            error: error instanceof Error ? error.message : 'Lofty verification failed.',
            readiness: buildIntegrationReadiness({
              hasLoftyApiKey: false,
              myplusIntegrationConfirmed: Boolean(myplusIntegrationConfirmed),
            }),
          },
          { status: 400 },
        );
      }
    }

    // ─── Verify active queue item in Lofty ────────────────────────────────
    case 'verifyLead': {
      const { id, apiKey } = body as { id: string; apiKey?: string };
      const key = apiKey?.trim() || process.env.LOFTY_API_KEY?.trim();
      if (!key) {
        return NextResponse.json(
          { ok: false, error: 'Fresh Lofty API key is required.' },
          { status: 400 },
        );
      }

      const item = (await getSyncQueue()).find((queueItem) => queueItem.id === id);
      if (!item) {
        return NextResponse.json({ ok: false, error: 'Item not found' }, { status: 404 });
      }

      const verified = await verifyLeadInLofty(key, item.firstName, item.lastName);
      return NextResponse.json({ ok: true, ...verified });
    }

    // ─── Fail sync ────────────────────────────────────────────────────────
    case 'failSync': {
      const { id, error: syncError } = body as { id: string; error: string };
      const updated = await markFailed(id, syncError);
      if (!updated) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      return NextResponse.json({ item: updated, queueStats: await getQueueStats() });
    }

    // ─── Skip lead ────────────────────────────────────────────────────────
    case 'skip': {
      const { id } = body as { id: string };
      const updated = await skipSyncItem(id);
      if (!updated) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      return NextResponse.json({ item: updated, queueStats: await getQueueStats() });
    }

    // ─── Sync items from queue into core CRM ──────────────────────────────
    case 'syncToCrm': {
      const queueItems = await getSyncQueue();
      const queued = queueItems.filter(i => i.status === 'QUEUED').slice(0, 50); // limit batch

      let syncedCount = 0;

      for (const item of queued) {
        try {
          // Check if contact already exists by email/phone or leadId
          const existingLead = await prisma.lead.findFirst({
            where: { 
               OR: [
                 { id: item.leadId },
                 { contact: { email: item.email } },
                 { contact: { phone: item.phone } }
               ],
               workspaceId: access.workspaceId 
            }
          });

          if (existingLead) {
             await updateSyncItem(item.id, { status: 'SYNCED', syncedAt: new Date().toISOString() });
             continue;
          }

          // Create new contact + lead
          const contact = await prisma.contact.create({
            data: {
              firstName: item.firstName,
              lastName: item.lastName,
              email: item.email,
              phone: item.phone,
              workspaceId: access.workspaceId,
            }
          });

          await prisma.lead.create({
            data: {
              id: item.leadId.startsWith('ld_') ? item.leadId : undefined,
              status: 'NEW',
              source: item.source || 'MyPlus Sync',
              workspaceId: access.workspaceId,
              contactId: contact.id,
            }
          });

          await updateSyncItem(item.id, { status: 'SYNCED', syncedAt: new Date().toISOString() });
          syncedCount++;
        } catch (err) {
          console.error(`Failed to sync item ${item.id}:`, err);
          await updateSyncItem(item.id, { status: 'FAILED', error: 'Database sync error' });
        }
      }

      return NextResponse.json({ 
        success: true, 
        syncedCount, 
        queueStats: await getQueueStats() 
      });
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}

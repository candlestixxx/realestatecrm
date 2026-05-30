import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SyncStatus =
  | 'QUEUED'        // waiting to be synced
  | 'FINDING'       // agent is locating lead in MyPlus portal
  | 'SYNCING'       // sync triggered in MyPlus, waiting for Lofty confirmation
  | 'SYNCED'        // confirmed in Lofty
  | 'FAILED'        // sync attempt failed
  | 'SKIPPED';      // operator chose to skip this lead

export type SyncQueueItem = {
  id: string;
  leadId: string;
  contactId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  assignedAgent: string | null;
  status: SyncStatus;
  myplusPortalUrl: string | null;
  loftyContactId: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
};

export type SyncQueueFile = {
  items: SyncQueueItem[];
};

// ─── Store ───────────────────────────────────────────────────────────────────

const storeFile = path.join(process.cwd(), 'data', 'sync-queue.json');

async function readStore(): Promise<SyncQueueFile> {
  try {
    const raw = await readFile(storeFile, 'utf8');
    const parsed = JSON.parse(raw) as Partial<SyncQueueFile>;
    return { items: parsed.items ?? [] };
  } catch {
    return { items: [] };
  }
}

async function writeStore(items: SyncQueueItem[]) {
  await mkdir(path.dirname(storeFile), { recursive: true });
  await writeFile(storeFile, JSON.stringify({ items }, null, 2) + '\n', 'utf8');
}

function now() {
  return new Date().toISOString();
}

// ─── Queue operations ────────────────────────────────────────────────────────

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const store = await readStore();
  return store.items.sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt),
  );
}

export async function getSyncQueueItem(id: string): Promise<SyncQueueItem | null> {
  const store = await readStore();
  return store.items.find((item) => item.id === id) ?? null;
}

export async function addToSyncQueue(lead: {
  leadId: string;
  contactId: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  assignedAgent?: string | null;
}): Promise<SyncQueueItem> {
  const store = await readStore();

  // avoid duplicates
  const existing = store.items.find((i) => i.leadId === lead.leadId);
  if (existing) return existing;

  const item: SyncQueueItem = {
    id: `sync-${lead.leadId}`,
    leadId: lead.leadId,
    contactId: lead.contactId,
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email ?? null,
    phone: lead.phone ?? null,
    source: lead.source ?? null,
    assignedAgent: lead.assignedAgent ?? null,
    status: 'QUEUED',
    myplusPortalUrl: null,
    loftyContactId: null,
    error: null,
    createdAt: now(),
    updatedAt: now(),
    syncedAt: null,
  };

  store.items.push(item);
  await writeStore(store.items);
  return item;
}

export async function addLeadsToSyncQueue(leads: Array<{
  leadId: string;
  contactId: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  assignedAgent?: string | null;
}>): Promise<{ added: number; duplicates: number }> {
  const store = await readStore();
  let added = 0;
  let duplicates = 0;
  const timestamp = now();

  for (const lead of leads) {
    const existing = store.items.find((i) => i.leadId === lead.leadId);
    if (existing) {
      duplicates++;
      continue;
    }

    store.items.push({
      id: `sync-${lead.leadId}`,
      leadId: lead.leadId,
      contactId: lead.contactId,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email ?? null,
      phone: lead.phone ?? null,
      source: lead.source ?? null,
      assignedAgent: lead.assignedAgent ?? null,
      status: 'QUEUED',
      myplusPortalUrl: null,
      loftyContactId: null,
      error: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      syncedAt: null,
    });
    added++;
  }

  await writeStore(store.items);
  return { added, duplicates };
}

export async function updateSyncItem(
  id: string,
  updates: Partial<Pick<SyncQueueItem, 'status' | 'myplusPortalUrl' | 'loftyContactId' | 'error' | 'syncedAt'>>,
): Promise<SyncQueueItem | null> {
  const store = await readStore();
  const idx = store.items.findIndex((i) => i.id === id);
  if (idx === -1) return null;

  store.items[idx] = {
    ...store.items[idx],
    ...updates,
    updatedAt: now(),
  };

  await writeStore(store.items);
  return store.items[idx];
}

export async function skipSyncItem(id: string): Promise<SyncQueueItem | null> {
  return updateSyncItem(id, { status: 'SKIPPED' });
}

export async function markSynced(id: string, loftyContactId: string): Promise<SyncQueueItem | null> {
  return updateSyncItem(id, {
    status: 'SYNCED',
    loftyContactId,
    syncedAt: now(),
  });
}

export async function markFailed(id: string, error: string): Promise<SyncQueueItem | null> {
  return updateSyncItem(id, { status: 'FAILED', error });
}

export async function getNextQueued(): Promise<SyncQueueItem | null> {
  const store = await readStore();
  return store.items.find((i) => i.status === 'QUEUED') ?? null;
}

export async function getQueueStats() {
  const store = await readStore();
  const counts = { total: 0, queued: 0, syncing: 0, synced: 0, failed: 0, skipped: 0 };
  for (const item of store.items) {
    counts.total++;
    if (item.status === 'QUEUED') counts.queued++;
    else if (item.status === 'SYNCING' || item.status === 'FINDING') counts.syncing++;
    else if (item.status === 'SYNCED') counts.synced++;
    else if (item.status === 'FAILED') counts.failed++;
    else if (item.status === 'SKIPPED') counts.skipped++;
  }
  return counts;
}

import fs from 'node:fs/promises';
import path from 'node:path';
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { Activity, Contact, Deal, Lead } from '@prisma/client';
import prisma from './prisma';
import { displayName, formatCurrency, compactText } from './rag-utils';

export type VectorEntityType = 'activity' | 'contact' | 'deal' | 'lead';

export type VectorSearchResult = {
  id: string;
  workspaceId: string;
  entityType: VectorEntityType;
  entityId: string;
  document: string;
  metadata: Record<string, unknown>;
  score: number;
  syncedAt: string;
  status: 'synced' | 'queued' | 'failed';
  destination: 'remote' | 'local';
};

type VectorSyncRecord = {
  workspaceId: string;
  entityType: VectorEntityType;
  entityId: string;
  document: string;
  metadata: Record<string, unknown>;
};

type VectorIndexEntry = VectorSyncRecord & {
  id: string;
  embedding: number[];
  syncedAt: string;
  status: 'synced' | 'queued' | 'failed';
  destination: 'remote' | 'local';
  provider: 'pinecone' | 'custom' | 'local';
  error?: string;
};

type VectorOutboxEntry = VectorSyncRecord & {
  id: string;
  createdAt: string;
  status: 'synced' | 'queued' | 'failed';
  destination: 'remote' | 'local';
  provider: 'pinecone' | 'custom' | 'local';
  error?: string;
};

export type ActivitySyncContext = {
  activity: Activity;
  lead?: Pick<Lead, 'id' | 'source' | 'status' | 'score'> | null;
  contact?: Pick<Contact, 'id' | 'firstName' | 'lastName' | 'email' | 'phone'> | null;
  deal?: Pick<Deal, 'id' | 'title' | 'stage' | 'value'> | null;
};

type VectorProviderMode = 'pinecone' | 'custom' | 'local';

type VectorQueryOptions = {
  workspaceId: string;
  query: string;
  limit?: number;
  entityTypes?: VectorEntityType[];
};

const DATA_DIR = path.join(process.cwd(), 'data');
const VECTOR_INDEX_PATH = path.join(DATA_DIR, 'vector-index.json');
const VECTOR_OUTBOX_PATH = path.join(DATA_DIR, 'rag-outbox.json');
const DEFAULT_EMBEDDING_MODEL = process.env.RAG_EMBEDDING_MODEL?.trim() || 'text-embedding-3-small';
const PINECONE_NAMESPACE = process.env.PINECONE_NAMESPACE?.trim() || 'realestatecrm';

function tokenize(text: string) {
  return text.toLowerCase().match(/[a-z0-9@._-]+/g) ?? [];
}

function normalizeVector(values: number[]) {
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  if (!magnitude) return values.map(() => 0);
  return values.map((value) => value / magnitude);
}

function cosineSimilarity(left: number[], right: number[]) {
  const length = Math.min(left.length, right.length);
  if (!length) return 0;

  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;
    dot += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  if (!leftMagnitude || !rightMagnitude) return 0;
  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

function fallbackEmbedding(text: string) {
  const dims = 128;
  const vector = new Array<number>(dims).fill(0);
  const tokens = tokenize(text);

  if (tokens.length === 0) {
    return vector;
  }

  tokens.forEach((token, index) => {
    let hash = 0;
    for (let i = 0; i < token.length; i += 1) {
      hash = (hash * 31 + token.charCodeAt(i)) | 0;
    }

    const slot = Math.abs(hash + index) % dims;
    const weight = Math.min(4, 1 + token.length / 8);
    vector[slot] += weight;

    if (index + 1 < tokens.length) {
      const bigram = `${token}_${tokens[index + 1]}`;
      let bigramHash = 0;
      for (let i = 0; i < bigram.length; i += 1) {
        bigramHash = (bigramHash * 33 + bigram.charCodeAt(i)) | 0;
      }
      vector[Math.abs(bigramHash) % dims] += 0.5;
    }
  });

  return normalizeVector(vector);
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function readVectorIndex() {
  return readJsonFile<VectorIndexEntry[]>(VECTOR_INDEX_PATH, []);
}

async function writeVectorIndex(entries: VectorIndexEntry[]) {
  await writeJsonFile(VECTOR_INDEX_PATH, entries);
}

async function appendOutbox(entry: VectorOutboxEntry) {
  const current = await readJsonFile<VectorOutboxEntry[]>(VECTOR_OUTBOX_PATH, []);
  current.unshift(entry);
  await writeJsonFile(VECTOR_OUTBOX_PATH, current.slice(0, 250));
}

async function generateEmbedding(text: string) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return fallbackEmbedding(text);
  }

  try {
    const result = await embed({
      model: openai.embedding(DEFAULT_EMBEDDING_MODEL),
      value: text,
    });

    return result.embedding;
  } catch (error) {
    console.warn('Falling back to deterministic embeddings:', error);
    return fallbackEmbedding(text);
  }
}

function buildLeadDocument(
  lead: Pick<Lead, 'id' | 'source' | 'status' | 'score'>,
  contact?: Pick<Contact, 'firstName' | 'lastName' | 'email' | 'phone'> | null,
) {
  return [
    `Lead ${lead.id}`,
    contact ? `Contact profile: ${displayName(contact.firstName, contact.lastName) || 'unknown'} / ${contact.email ?? 'no email'} / ${contact.phone ?? 'no phone'}` : null,
    `Source: ${lead.source ?? 'unknown'}`,
    `Status: ${lead.status ?? 'unknown'}`,
    `Score: ${lead.score ?? 0}`,
  ]
    .filter(Boolean)
    .join('\n');
}

function buildContactDocument(contact: Pick<Contact, 'id' | 'firstName' | 'lastName' | 'email' | 'phone'>) {
  return [
    `Contact ${displayName(contact.firstName, contact.lastName) || contact.id}`,
    `Email: ${contact.email ?? 'no email'}`,
    `Phone: ${contact.phone ?? 'no phone'}`,
  ].join('\n');
}

function buildActivityDocument({ activity, lead, contact, deal }: ActivitySyncContext) {
  const parts = [
    `Activity type: ${activity.type}`,
    `Activity content: ${activity.content}`,
  ];

  if (lead) {
    parts.push(
      `Lead: ${contact ? displayName(contact.firstName, contact.lastName) || 'Unknown lead' : 'Unknown lead'} (${contact?.email ?? 'no email'})`,
      `Lead source: ${lead.source ?? 'unknown'}`,
      `Lead status: ${lead.status ?? 'unknown'}`,
      `Lead score: ${lead.score ?? 0}`,
    );
  }

  if (contact) {
    parts.push(
      `Contact: ${displayName(contact.firstName, contact.lastName) || 'Unknown contact'} (${contact.email ?? 'no email'})`,
      `Contact phone: ${contact.phone ?? 'no phone'}`,
    );
  }

  if (deal) {
    parts.push(
      `Deal: ${deal.title ?? 'Unknown deal'}`,
      `Deal stage: ${deal.stage ?? 'unknown'}`,
      `Deal value: ${formatCurrency(deal.value)}`,
    );
  }

  return parts.join('\n');
}

function buildDealDocument(deal: Pick<Deal, 'id' | 'title' | 'stage' | 'value'>, contact?: Pick<Contact, 'firstName' | 'lastName' | 'email'> | null) {
  return [
    `Deal ${deal.title || deal.id}`,
    `Stage: ${deal.stage ?? 'unknown'}`,
    `Value: ${formatCurrency(deal.value)}`,
    contact ? `Primary contact: ${displayName(contact.firstName, contact.lastName) || 'unknown'} (${contact.email ?? 'no email'})` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

function getVectorProviderMode(): VectorProviderMode {
  const configured = process.env.RAG_VECTOR_PROVIDER?.trim().toLowerCase();
  if (configured === 'pinecone' || configured === 'custom' || configured === 'local') {
    return configured;
  }

  if (process.env.PINECONE_API_KEY?.trim() && process.env.PINECONE_INDEX_HOST?.trim()) {
    return 'pinecone';
  }

  if (process.env.RAG_VECTOR_ENDPOINT?.trim()) {
    return 'custom';
  }

  return 'local';
}

function normalizeHost(host: string) {
  return host.trim().replace(/\/+$/, '');
}

function buildPineconeUrl(pathSuffix: string) {
  const host = process.env.PINECONE_INDEX_HOST?.trim();
  if (!host) {
    throw new Error('PINECONE_INDEX_HOST is required for Pinecone sync');
  }

  return `${normalizeHost(host)}${pathSuffix.startsWith('/') ? pathSuffix : `/${pathSuffix}`}`;
}

function sanitizeMetadata(metadata: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined),
  );
}

async function upsertToCustomEndpoint(record: VectorSyncRecord, embedding: number[], syncedAt: string) {
  const endpoint = process.env.RAG_VECTOR_ENDPOINT?.trim();
  if (!endpoint) {
    throw new Error('RAG_VECTOR_ENDPOINT is required for custom sync');
  }

  const apiKey = process.env.RAG_VECTOR_API_KEY?.trim();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      ...record,
      embedding,
      syncedAt,
      namespace: record.workspaceId,
    }),
  });

  if (!response.ok) {
    throw new Error((await response.text().catch(() => 'Custom vector sync failed')).slice(0, 500));
  }
}

async function upsertToPinecone(record: VectorSyncRecord, embedding: number[], syncedAt: string) {
  const apiKey = process.env.PINECONE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('PINECONE_API_KEY is required for Pinecone sync');
  }

  const response = await fetch(buildPineconeUrl('/vectors/upsert'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': apiKey,
    },
    body: JSON.stringify({
      namespace: PINECONE_NAMESPACE,
      vectors: [
        {
          id: `${record.entityType}:${record.entityId}`,
          values: embedding,
          metadata: sanitizeMetadata({
            ...record.metadata,
            workspaceId: record.workspaceId,
            entityType: record.entityType,
            entityId: record.entityId,
            document: record.document,
            syncedAt,
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error((await response.text().catch(() => 'Pinecone vector sync failed')).slice(0, 500));
  }
}

async function syncVectorRecord(record: VectorSyncRecord) {
  const embedding = await generateEmbedding(record.document);
  const index = await readVectorIndex();
  const now = new Date().toISOString();
  const id = `${record.entityType}:${record.entityId}`;
  const provider = getVectorProviderMode();
  let status: VectorIndexEntry['status'] = provider === 'local' ? 'queued' : 'queued';
  let destination: VectorIndexEntry['destination'] = provider === 'local' ? 'local' : 'remote';
  let error: string | undefined;

  try {
    if (provider === 'pinecone') {
      await upsertToPinecone(record, embedding, now);
      status = 'synced';
      destination = 'remote';
    } else if (provider === 'custom') {
      await upsertToCustomEndpoint(record, embedding, now);
      status = 'synced';
      destination = 'remote';
    }
  } catch (syncError) {
    status = 'failed';
    destination = 'local';
    error = syncError instanceof Error ? syncError.message : 'Unknown vector sync error';
  }

  const entry: VectorIndexEntry = {
    ...record,
    id,
    embedding,
    syncedAt: now,
    status,
    destination,
    provider,
    error,
  };

  const existingIndex = index.filter((existing) => existing.id !== id);
  existingIndex.unshift(entry);
  await writeVectorIndex(existingIndex.slice(0, 2000));

  await appendOutbox({
    ...record,
    id,
    createdAt: now,
    status,
    destination,
    provider,
    error,
  });

  return { status, destination, provider, error };
}

function normalizeRemoteMatches(
  matches: Array<{
    id?: string;
    score?: number;
    metadata?: Record<string, unknown>;
  }>,
): VectorSearchResult[] {
  return matches
    .map((match) => {
      const metadata = match.metadata ?? {};
      const workspaceId = typeof metadata.workspaceId === 'string' ? metadata.workspaceId : '';
      const entityType = typeof metadata.entityType === 'string' ? metadata.entityType : '';
      const entityId = metadata.entityId;
      const document = typeof metadata.document === 'string' ? metadata.document : '';
      const syncedAt = typeof metadata.syncedAt === 'string' ? metadata.syncedAt : new Date().toISOString();
      const validEntityType =
        entityType === 'activity' || entityType === 'contact' || entityType === 'deal' || entityType === 'lead'
          ? entityType
          : null;

      if (!workspaceId || !validEntityType) {
        return null;
      }

      const result: VectorSearchResult = {
        id: match.id ?? `${validEntityType}:${String(entityId ?? '')}`,
        workspaceId,
        entityType: validEntityType,
        entityId: String(entityId ?? ''),
        document,
        metadata,
        score: match.score ?? 0,
        syncedAt,
        status: 'synced',
        destination: 'remote',
      };
      return result;
    })
    .filter((item): item is VectorSearchResult => item !== null);
}

async function queryPinecone({ workspaceId, query, limit = 5, entityTypes }: VectorQueryOptions) {
  const apiKey = process.env.PINECONE_API_KEY?.trim();
  if (!apiKey) {
    return [];
  }

  const queryEmbedding = await generateEmbedding(query);
  const response = await fetch(buildPineconeUrl('/query'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': apiKey,
    },
    body: JSON.stringify({
      namespace: PINECONE_NAMESPACE,
      topK: limit,
      includeMetadata: true,
      vector: queryEmbedding,
      filter: {
        workspaceId: { $eq: workspaceId },
        ...(entityTypes?.length ? { entityType: { $in: entityTypes } } : {}),
      },
    }),
  });

  if (!response.ok) {
    throw new Error((await response.text().catch(() => 'Pinecone query failed')).slice(0, 500));
  }

  const payload = (await response.json()) as { matches?: Array<{ id?: string; score?: number; metadata?: Record<string, unknown> }> };
  return normalizeRemoteMatches(payload.matches ?? []);
}

async function queryCustomEndpoint({ workspaceId, query, limit = 5, entityTypes }: VectorQueryOptions) {
  const endpoint = process.env.RAG_VECTOR_ENDPOINT?.trim();
  if (!endpoint) {
    return [];
  }

  const apiKey = process.env.RAG_VECTOR_API_KEY?.trim();
  const queryEmbedding = await generateEmbedding(query);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      mode: 'query',
      workspaceId,
      limit,
      entityTypes,
      query,
      embedding: queryEmbedding,
      namespace: workspaceId,
    }),
  });

  if (!response.ok) {
    throw new Error((await response.text().catch(() => 'Custom query failed')).slice(0, 500));
  }

  const payload = (await response.json()) as
    | Array<{ id?: string; score?: number; metadata?: Record<string, unknown> }>
    | { matches?: Array<{ id?: string; score?: number; metadata?: Record<string, unknown> }> };

  const matches = Array.isArray(payload) ? payload : payload.matches ?? [];
  return normalizeRemoteMatches(matches);
}

async function queryLocalIndex({ workspaceId, query, limit = 5, entityTypes }: VectorQueryOptions) {
  const index = await readVectorIndex();
  const filtered = index.filter((entry) => {
    const matchesWorkspace = entry.workspaceId === workspaceId;
    const matchesEntityType = !entityTypes?.length || entityTypes.includes(entry.entityType);
    return matchesWorkspace && matchesEntityType;
  });

  if (!query.trim()) {
    return filtered
      .sort((a, b) => b.syncedAt.localeCompare(a.syncedAt))
      .slice(0, limit)
      .map((entry) => ({
        id: entry.id,
        workspaceId: entry.workspaceId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        document: entry.document,
        metadata: entry.metadata,
        score: 0,
        syncedAt: entry.syncedAt,
        status: entry.status,
        destination: entry.destination,
      }));
  }

  const queryEmbedding = await generateEmbedding(query);

  return filtered
    .map((entry) => ({
      id: entry.id,
      workspaceId: entry.workspaceId,
      entityType: entry.entityType,
      entityId: entry.entityId,
      document: entry.document,
      metadata: entry.metadata,
      score: cosineSimilarity(queryEmbedding, entry.embedding),
      syncedAt: entry.syncedAt,
      status: entry.status,
      destination: entry.destination,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function syncLeadToVectorStore(
  lead: Pick<Lead, 'id' | 'workspaceId' | 'source' | 'status' | 'score'>,
  contact?: Pick<Contact, 'firstName' | 'lastName' | 'email' | 'phone'> | null,
) {
  return syncVectorRecord({
    workspaceId: lead.workspaceId,
    entityType: 'lead',
    entityId: lead.id,
    document: buildLeadDocument(lead, contact),
    metadata: {
      leadId: lead.id,
      contactEmail: contact?.email ?? null,
      status: lead.status,
      source: lead.source,
      score: lead.score,
    },
  });
}

export async function syncContactToVectorStore(
  contact: Pick<Contact, 'id' | 'workspaceId' | 'firstName' | 'lastName' | 'email' | 'phone'>,
) {
  return syncVectorRecord({
    workspaceId: contact.workspaceId,
    entityType: 'contact',
    entityId: contact.id,
    document: buildContactDocument(contact),
    metadata: {
      contactId: contact.id,
      email: contact.email,
      phone: contact.phone,
    },
  });
}

export async function syncActivityToVectorStore(context: ActivitySyncContext) {
  return syncVectorRecord({
    workspaceId: context.activity.workspaceId,
    entityType: 'activity',
    entityId: context.activity.id,
    document: buildActivityDocument(context),
    metadata: {
      activityId: context.activity.id,
      activityType: context.activity.type,
      leadId: context.activity.leadId,
      contactId: context.activity.contactId,
      dealId: context.activity.dealId,
      createdAt: context.activity.createdAt.toISOString(),
    },
  });
}

export async function syncDealToVectorStore(
  deal: Pick<Deal, 'id' | 'workspaceId' | 'title' | 'stage' | 'value'>,
  contact?: Pick<Contact, 'firstName' | 'lastName' | 'email'> | null,
) {
  return syncVectorRecord({
    workspaceId: deal.workspaceId,
    entityType: 'deal',
    entityId: deal.id,
    document: buildDealDocument(deal, contact),
    metadata: {
      dealId: deal.id,
      stage: deal.stage,
      value: deal.value,
      contactEmail: contact?.email ?? null,
    },
  });
}

export async function searchWorkspaceVectors({ workspaceId, query, limit = 5, entityTypes }: VectorQueryOptions): Promise<VectorSearchResult[]> {
  const provider = getVectorProviderMode();

  try {
    if (provider === 'pinecone') {
      const remote = await queryPinecone({ workspaceId, query, limit, entityTypes });
      if (remote.length > 0) {
        return remote;
      }
    } else if (provider === 'custom') {
      const remote = await queryCustomEndpoint({ workspaceId, query, limit, entityTypes });
      if (remote.length > 0) {
        return remote;
      }
    }
  } catch (error) {
    console.warn('Remote vector query failed, falling back to local index:', error);
  }

  return queryLocalIndex({ workspaceId, query, limit, entityTypes });
}

export type ChatContextInput = {
  workspaceSlug: string;
  query: string;
};

function formatList(title: string, items: string[]) {
  if (items.length === 0) return `${title}: none found.`;
  return `${title}:\n- ${items.join('\n- ')}`;
}

export async function buildChatContext({ workspaceSlug, query }: ChatContextInput) {
  const [workspace, leads, contacts, deals, activities, vectorMatches] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: workspaceSlug },
      select: { id: true, name: true },
    }),
    prisma.lead.findMany({
      where: { workspaceId: workspaceSlug },
      orderBy: { updatedAt: 'desc' },
      take: 8,
      select: {
        id: true,
        status: true,
        source: true,
        updatedAt: true,
        contact: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
    }),
    prisma.contact.findMany({
      where: { workspaceId: workspaceSlug },
      orderBy: { updatedAt: 'desc' },
      take: 8,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        updatedAt: true,
      },
    }),
    prisma.deal.findMany({
      where: { workspaceId: workspaceSlug },
      orderBy: { updatedAt: 'desc' },
      take: 6,
      select: {
        id: true,
        title: true,
        stage: true,
        value: true,
        updatedAt: true,
      },
    }),
    prisma.activity.findMany({
      where: { workspaceId: workspaceSlug },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true,
        type: true,
        content: true,
        createdAt: true,
        leadId: true,
        contactId: true,
        dealId: true,
      },
    }),
    searchWorkspaceVectors({
      workspaceId: workspaceSlug,
      query,
      limit: 8,
      entityTypes: ['lead', 'contact', 'activity', 'deal'],
    }),
  ]);

  const workspaceLabel = workspace?.name ?? workspaceSlug;

  const recentLeads = leads.slice(0, 5).map((lead) => {
    return [lead.contact?.firstName, lead.contact?.lastName].filter(Boolean).join(' ') + ` <${lead.contact?.email ?? 'no-email'}> — ${lead.status}`;
  });

  const recentContacts = contacts.slice(0, 5).map((contact) => {
    return [contact.firstName, contact.lastName].filter(Boolean).join(' ') + ` <${contact.email ?? 'no-email'}>`;
  });

  const recentDeals = deals.slice(0, 5).map((deal) => {
    return `${deal.title} — ${deal.stage}${deal.value ? ` — $${Number(deal.value).toLocaleString('en-US')}` : ''}`;
  });

  const recentActivities = activities.slice(0, 5).map((activity) => {
    return `${activity.createdAt.toISOString()} | ${activity.type} | ${compactText(activity.content, 180)}`;
  });

  const semanticMatches = vectorMatches.map((match, index) => {
    const metadataSummary = Object.entries(match.metadata)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${key}=${String(value)}`)
      .join(', ');

    return [
      `${index + 1}. ${match.entityType.toUpperCase()} ${match.entityId} (score ${match.score.toFixed(3)})`,
      compactText(match.document, 260),
      metadataSummary ? `Metadata: ${metadataSummary}` : null,
    ]
      .filter(Boolean)
      .join('\n');
  });

  return [
    '=== WORKSPACE RAG CONTEXT ===',
    `Workspace: ${workspaceLabel} (${workspaceSlug})`,
    `Query: ${query.trim() || 'none'}`,
    '',
    `Counts: leads=${leads.length}, contacts=${contacts.length}, deals=${deals.length}, activities=${activities.length}`,
    '',
    formatList('Top Semantic Matches', semanticMatches),
    '',
    formatList('Recent Leads', recentLeads),
    '',
    formatList('Recent Contacts', recentContacts),
    '',
    formatList('Recent Deals', recentDeals),
    '',
    formatList('Recent Activities', recentActivities),
  ].join('\n');
}

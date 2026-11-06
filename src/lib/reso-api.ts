import prisma from './prisma';
import { decrypt } from './encryption';
import { normalizeResoListing } from './reso-normalize';
export { normalizeResoListing } from './reso-normalize';
export type { NormalizedListing } from './reso-normalize';

// RESO Web API -> CRM Listing sync (v0.62.0).
//
// Two credential models, both token-based (MLS browser passwords are never
// stored or used — MLS rules prohibit credential sharing / automated login):
//  A) Broker feed: one RESO server token for the brokerage in server env
//     (MLS_RES0_ENDPOINT_URL + MLS_RES0_SERVER_TOKEN). Each agent only
//     registers their public MLS Member ID; listings whose ListAgentKey /
//     ListAgentMlsId matches are auto-assigned to that agent.
//  B) Per-agent token: an agent pastes a personal RESO server token (or
//     OAuth client credentials) issued by their MLS/vendor. Secrets are
//     stored AES-256-GCM encrypted in MlsConnection and never logged.

export async function syncResoListing(
  workspaceId: string,
  resoPayload: any,
  opts: { listingAgentId?: string | null; mlsSource?: string; mlsOrganizationId?: string | null } = {},
) {
  const n = normalizeResoListing(resoPayload);
  const data = {
    status: n.status,
    listPrice: n.listPrice,
    soldPrice: n.soldPrice,
    address: n.address,
    city: n.city,
    state: n.state,
    zip: n.zip,
    bedrooms: n.bedrooms,
    bathrooms: n.bathrooms,
    squareFeet: n.squareFeet,
    lotSize: n.lotSize,
    yearBuilt: n.yearBuilt,
    propertyType: n.propertyType,
    description: n.description,
    photos: n.photos,
    virtualTourUrl: n.virtualTourUrl,
    listAgentMlsId: n.listAgentMlsId,
    listDate: n.listDate,
    soldDate: n.soldDate,
    daysOnMarket: n.daysOnMarket,
    mlsSource: opts.mlsSource || 'RESO',
    mlsOrganizationId: opts.mlsOrganizationId || null,
    ...(opts.listingAgentId ? { listingAgentId: opts.listingAgentId } : {}),
  };
  return prisma.listing.upsert({
    where: { mlsNumber: n.mlsNumber },
    create: { ...data, mlsNumber: n.mlsNumber, workspaceId },
    update: data,
  });
}

export interface ResoFetchOpts {
  endpointUrl: string;
  token: string;
  top?: number;
  filter?: string;
  timeoutMs?: number;
}

export async function fetchResoProperties(opts: ResoFetchOpts): Promise<any[]> {
  const base = opts.endpointUrl.replace(/\/+$/, '');
  const url = new URL(`${base}/Property`);
  url.searchParams.set('$top', String(opts.top ?? 100));
  url.searchParams.set('$orderby', 'ModificationTimestamp desc');
  if (opts.filter) url.searchParams.set('$filter', opts.filter);
  const resp = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${opts.token}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(opts.timeoutMs ?? 20000),
  });
  if (!resp.ok) {
    // Never include the Authorization header or token in errors/logs.
    throw new Error(`RESO endpoint returned HTTP ${resp.status}`);
  }
  const json: any = await resp.json();
  return Array.isArray(json?.value) ? json.value : Array.isArray(json) ? json : [];
}

export async function testResoConnection(endpointUrl: string, token: string): Promise<{ ok: true; count: number }> {
  const rows = await fetchResoProperties({ endpointUrl, token, top: 1, timeoutMs: 12000 });
  return { ok: true, count: rows.length };
}

async function resolveAgentIdByMlsId(workspaceId: string, listAgentMlsId: string | null): Promise<string | null> {
  if (!listAgentMlsId) return null;
  const conn = await prisma.mlsConnection.findFirst({
    where: { workspaceId, memberMlsId: listAgentMlsId },
    select: { userId: true },
  });
  return conn?.userId || null;
}

export interface SyncResult { fetched: number; upserted: number; assigned: number }

export async function syncListingsFromReso(
  workspaceId: string,
  creds: { endpointUrl: string; token: string; mlsSource: string; organizationId?: string | null; onlyAgentMlsId?: string | null; top?: number },
): Promise<SyncResult> {
  const filter = creds.onlyAgentMlsId ? `ListAgentKey eq '${String(creds.onlyAgentMlsId).replace(/'/g, "''")}'` : undefined;
  const rows = await fetchResoProperties({ endpointUrl: creds.endpointUrl, token: creds.token, top: creds.top ?? 200, filter });
  let upserted = 0;
  let assigned = 0;
  for (const row of rows) {
    try {
      const n = normalizeResoListing(row);
      const agentId = creds.onlyAgentMlsId
        ? undefined
        : await resolveAgentIdByMlsId(workspaceId, n.listAgentMlsId);
      await syncResoListing(workspaceId, row, {
        listingAgentId: agentId || undefined,
        mlsSource: creds.mlsSource,
        mlsOrganizationId: creds.organizationId || null,
      });
      upserted++;
      if (agentId) assigned++;
    } catch {
      // Skip malformed rows; never fail the whole sync for one listing.
    }
  }
  return { fetched: rows.length, upserted, assigned };
}

function secretOf(conn: { encryptedToken: string | null; encryptedClientSecret: string | null }): string | null {
  const raw = conn.encryptedToken || conn.encryptedClientSecret;
  if (!raw) return null;
  try { return decrypt(raw); } catch { return null; }
}

export async function syncMlsConnection(connectionId: string): Promise<SyncResult> {
  const conn = await prisma.mlsConnection.findUnique({ where: { id: connectionId } });
  if (!conn) throw new Error('MLS connection not found');
  const endpointUrl = conn.endpointUrl || process.env.MLS_RES0_ENDPOINT_URL || '';
  const token = secretOf(conn) || process.env.MLS_RES0_SERVER_TOKEN || '';
  if (!endpointUrl || !token) {
    const msg = 'MLS connection has no endpoint/token and no broker feed is configured (MLS_RES0_ENDPOINT_URL / MLS_RES0_SERVER_TOKEN).';
    await prisma.mlsConnection.update({ where: { id: conn.id }, data: { lastSyncStatus: 'ERROR', lastError: msg, lastSyncAt: new Date() } });
    throw new Error(msg);
  }
  try {
    const result = await syncListingsFromReso(conn.workspaceId, {
      endpointUrl,
      token,
      mlsSource: conn.mlsName,
      organizationId: conn.organizationId,
      // Per-agent token: scope to that agent's own listings when we know their ID.
      onlyAgentMlsId: secretOf(conn) ? conn.memberMlsId : null,
    });
    await prisma.mlsConnection.update({
      where: { id: conn.id },
      data: { lastSyncStatus: 'OK', lastError: null, lastSyncAt: new Date() },
    });
    return result;
  } catch (e) {
    await prisma.mlsConnection.update({
      where: { id: conn.id },
      data: { lastSyncStatus: 'ERROR', lastError: (e as Error).message.slice(0, 500), lastSyncAt: new Date() },
    });
    throw e;
  }
}

export async function syncBrokerFeed(workspaceId: string): Promise<SyncResult> {
  const endpointUrl = process.env.MLS_RES0_ENDPOINT_URL || '';
  const token = process.env.MLS_RES0_SERVER_TOKEN || '';
  if (!endpointUrl || !token) {
    throw new Error('Broker MLS feed is not configured (set MLS_RES0_ENDPOINT_URL and MLS_RES0_SERVER_TOKEN on the server).');
  }
  return syncListingsFromReso(workspaceId, {
    endpointUrl,
    token,
    mlsSource: process.env.MLS_NAME || 'BROKER_FEED',
    organizationId: process.env.MLS_ORGANIZATION_ID || null,
  });
}

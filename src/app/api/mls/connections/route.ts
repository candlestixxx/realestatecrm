import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess, workspaceErrorResponse } from '@/lib/workspace-access';
import { encrypt, decrypt } from '@/lib/encryption';
import { testResoConnection, syncMlsConnection } from '@/lib/reso-api';
import prisma from '@/lib/prisma';

// Per-agent MLS connections (v0.62.0). Secrets are AES-256-GCM encrypted at
// rest and never returned by the API. MLS browser passwords are not accepted.

const MLS_NAMES = ['MIREALSOURCE', 'REALCOMP', 'OTHER'];
const AUTH_TYPES = ['SERVER_TOKEN', 'OAUTH_CLIENT', 'MEMBER_ID_ONLY'];

function publicView(c: any) {
  return {
    id: c.id,
    mlsName: c.mlsName,
    endpointUrl: c.endpointUrl,
    authType: c.authType,
    clientId: c.clientId,
    memberMlsId: c.memberMlsId,
    organizationId: c.organizationId,
    isActive: c.isActive,
    hasToken: Boolean(c.encryptedToken || c.encryptedClientSecret),
    lastSyncAt: c.lastSyncAt,
    lastSyncStatus: c.lastSyncStatus,
    lastError: c.lastError,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

async function auth() {
  const session = await getServerSession(authOptions);
  return requireWorkspaceAccess(session);
}

export async function GET() {
  let access;
  try { access = await auth(); } catch (e) { return workspaceErrorResponse(e) || NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const rows = await prisma.mlsConnection.findMany({
    where: { userId: access.userId, workspaceId: access.workspaceId },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ connections: rows.map(publicView) });
}

export async function POST(request: NextRequest) {
  let access;
  try { access = await auth(); } catch (e) { return workspaceErrorResponse(e) || NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const mlsName = String(body.mlsName || '').toUpperCase();
  if (!MLS_NAMES.includes(mlsName)) return NextResponse.json({ error: `mlsName must be one of ${MLS_NAMES.join(', ')}` }, { status: 400 });
  const authType = String(body.authType || 'SERVER_TOKEN').toUpperCase();
  if (!AUTH_TYPES.includes(authType)) return NextResponse.json({ error: `authType must be one of ${AUTH_TYPES.join(', ')}` }, { status: 400 });

  const endpointUrl = body.endpointUrl ? String(body.endpointUrl).trim() : null;
  if (endpointUrl && !/^https:\/\//i.test(endpointUrl)) {
    return NextResponse.json({ error: 'endpointUrl must be an https:// RESO Web API base URL' }, { status: 400 });
  }
  // Reject anything that looks like a password field — we never store MLS passwords.
  if (body.password) return NextResponse.json({ error: 'MLS passwords are never stored. Use a RESO server token, OAuth client credentials, or Member ID only.' }, { status: 400 });

  const token = body.token ? String(body.token) : null;
  const clientSecret = body.clientSecret ? String(body.clientSecret) : null;
  if (authType === 'SERVER_TOKEN' && !token && !body.id) {
    // Allow Member-ID-only registration under SERVER_TOKEN by downgrading.
  }
  const data: any = {
    userId: access.userId,
    workspaceId: access.workspaceId,
    mlsName,
    authType: authType === 'SERVER_TOKEN' && !token ? 'MEMBER_ID_ONLY' : authType,
    endpointUrl,
    clientId: body.clientId ? String(body.clientId).trim() : null,
    memberMlsId: body.memberMlsId ? String(body.memberMlsId).trim() : null,
    organizationId: body.organizationId ? String(body.organizationId).trim() : null,
    isActive: body.isActive !== false,
  };
  if (token) data.encryptedToken = encrypt(token);
  if (clientSecret) data.encryptedClientSecret = encrypt(clientSecret);

  const saved = await prisma.mlsConnection.upsert({
    where: { userId_mlsName: { userId: access.userId, mlsName } },
    create: data,
    update: data,
  });
  return NextResponse.json({ connection: publicView(saved) }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  let access;
  try { access = await auth(); } catch (e) { return workspaceErrorResponse(e) || NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const row = await prisma.mlsConnection.findFirst({ where: { id, userId: access.userId, workspaceId: access.workspaceId } });
  if (!row) return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
  await prisma.mlsConnection.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// POST /api/mls/connections/test  { connectionId } or { endpointUrl, token }
export async function PATCH(request: NextRequest) {
  let access;
  try { access = await auth(); } catch (e) { return workspaceErrorResponse(e) || NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const action = String(body.action || 'test');
  try {
    if (action === 'sync') {
      if (!body.connectionId) return NextResponse.json({ error: 'connectionId required' }, { status: 400 });
      const row = await prisma.mlsConnection.findFirst({ where: { id: body.connectionId, userId: access.userId, workspaceId: access.workspaceId } });
      if (!row) return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
      const result = await syncMlsConnection(row.id);
      return NextResponse.json({ ok: true, ...result });
    }
    // test
    let endpointUrl = body.endpointUrl ? String(body.endpointUrl) : '';
    let token = body.token ? String(body.token) : '';
    if (body.connectionId) {
      const row = await prisma.mlsConnection.findFirst({ where: { id: body.connectionId, userId: access.userId, workspaceId: access.workspaceId } });
      if (!row) return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
      endpointUrl = endpointUrl || row.endpointUrl || process.env.MLS_RES0_ENDPOINT_URL || '';
      if (!token) {
        const raw = row.encryptedToken || row.encryptedClientSecret;
        if (raw) { try { token = decrypt(raw); } catch { /* handled below */ } }
        if (!token) token = process.env.MLS_RES0_SERVER_TOKEN || '';
      }
    }
    if (!endpointUrl || !token) {
      return NextResponse.json({ ok: false, error: 'No endpoint/token to test. Save a RESO token first, or configure the broker feed (MLS_RES0_ENDPOINT_URL / MLS_RES0_SERVER_TOKEN).' }, { status: 400 });
    }
    const r = await testResoConnection(endpointUrl, token);
    return NextResponse.json({ ok: true, sampleCount: r.count });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message.slice(0, 300) }, { status: 502 });
  }
}

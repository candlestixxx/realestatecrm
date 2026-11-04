import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { resolveWorkspaceAccess } from '@/lib/workspace-access';
import { createHmac } from 'node:crypto';

/**
 * ContentPlanner API proxy — /api/contentplanner/[...path]
 *
 * Why: dashboard panels (Content Pipeline, notifications, engagement,
 * video/podcast) call the ContentPlanner API from the browser, but the API
 * requires a Bearer JWT the browser cannot safely hold (cross-service auth).
 * This route:
 *   1. Authenticates the caller with the MAIN CRM's NextAuth session
 *   2. Resolves the caller's ACTIVE CRM workspace and syncs it into the
 *      ContentPlanner workspace table (cross-service workspace mapping)
 *   3. Signs a short-lived service JWT carrying the workspace claim (HS256)
 *   4. Forwards the request server-side to the API's internal origin
 *
 * The browser only ever talks to same-origin /api/contentplanner/*.
 */

export const dynamic = 'force-dynamic';

const API_INTERNAL = process.env.CONTENT_SERVICE_URL || 'http://127.0.0.1:3216';

/** Mint the service JWT the ContentPlanner API verifies (HS256). */
function signServiceJwt(userId: string, workspaceId?: string): string {
  const secret = process.env.CONTENTPLANNER_SERVICE_SECRET;
  if (!secret) return '';
  const b64 = (s: string | Buffer) => Buffer.from(s).toString('base64url');
  const header = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64(
    JSON.stringify({
      sub: userId,
      role: 'OWNER',
      exp: Math.floor(Date.now() / 1000) + 300,
      ...(workspaceId ? { workspaceId } : {}),
    })
  );
  const sig = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

/**
 * Ensure the caller's CRM workspace exists in ContentPlanner's workspace
 * table (same id) so workspace-scoped rows can reference it. Upsert is
 * idempotent and cheap; failures don't block reads.
 */
async function syncWorkspace(userId: string, workspaceId: string, name: string): Promise<void> {
  try {
    await fetch(`${API_INTERNAL}/workspace/sync`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${signServiceJwt(userId)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: workspaceId, name, businessType: 'real_estate' }),
      signal: AbortSignal.timeout(8000),
    });
  } catch (e) {
    console.warn('[ContentPlanner proxy] workspace sync skipped:', (e as any)?.message);
  }
}

async function proxy(req: NextRequest, path: string[]) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || (session?.user?.email ?? 'dashboard-user');
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.CONTENTPLANNER_SERVICE_SECRET) {
    return NextResponse.json(
      { error: 'Proxy unavailable: CONTENTPLANNER_SERVICE_SECRET is not configured.' },
      { status: 503 }
    );
  }

  // Cross-service workspace mapping: resolve the caller's active CRM
  // workspace and mirror it into ContentPlanner before forwarding.
  let workspaceId: string | undefined;
  try {
    const access = await resolveWorkspaceAccess(session);
    if (access?.workspaceId) {
      workspaceId = access.workspaceId;
      await syncWorkspace(String(userId), workspaceId, access.workspaceSlug || workspaceId);
    }
  } catch (e) {
    console.warn('[ContentPlanner proxy] workspace resolve skipped:', (e as any)?.message);
  }

  const target = `${API_INTERNAL}/${path.join('/')}${req.nextUrl.search}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${signServiceJwt(String(userId), workspaceId)}`,
    'Content-Type': req.headers.get('content-type') || 'application/json',
  };

  const init: RequestInit = { method: req.method, headers };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.text();
  }

  try {
    const resp = await fetch(target, { ...init, signal: AbortSignal.timeout(25000) });
    const body = await resp.text();
    return new NextResponse(body, {
      status: resp.status,
      headers: { 'Content-Type': resp.headers.get('content-type') || 'application/json' },
    });
  } catch (e: any) {
    console.error('[ContentPlanner proxy] forward failed:', e?.message);
    return NextResponse.json({ error: 'ContentPlanner API unreachable.' }, { status: 502 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}

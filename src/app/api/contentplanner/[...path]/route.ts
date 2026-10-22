import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createHmac } from 'node:crypto';

/**
 * ContentPlanner API proxy — /api/contentplanner/[...path]
 *
 * Why: dashboard panels (Content Pipeline, notifications, engagement,
 * video/podcast) call the ContentPlanner API from the browser, but the API
 * requires a Bearer JWT the browser cannot safely hold (cross-service auth).
 * This route:
 *   1. Authenticates the caller with the MAIN CRM's NextAuth session
 *   2. Signs a short-lived service JWT (HS256) for the internal API
 *   3. Forwards the request server-side to the API's internal origin
 *
 * The browser only ever talks to same-origin /api/contentplanner/*.
 */

export const dynamic = 'force-dynamic';

const API_INTERNAL = process.env.CONTENT_SERVICE_URL || 'http://127.0.0.1:3216';

/** Mint the service JWT the ContentPlanner API verifies (HS256). */
function signServiceJwt(userId: string): string {
  const secret = process.env.CONTENTPLANNER_SERVICE_SECRET;
  if (!secret) return '';
  const b64 = (s: string | Buffer) => Buffer.from(s).toString('base64url');
  const header = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64(
    JSON.stringify({ sub: userId, role: 'OWNER', exp: Math.floor(Date.now() / 1000) + 300 })
  );
  const sig = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
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

  const target = `${API_INTERNAL}/${path.join('/')}${req.nextUrl.search}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${signServiceJwt(String(userId))}`,
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

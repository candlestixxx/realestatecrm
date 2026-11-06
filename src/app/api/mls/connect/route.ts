import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getActiveWorkspaceSlug } from '@/lib/workspace-context';
import { getMlsStatus, saveMlsCredential, disconnectMls, testMlsConnection } from '@/lib/mls-connection';

// The realtor's MLS login for the calculator. GET = masked status only
// (secret never leaves the server). POST = save + test. DELETE = remove.
async function actor() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  return { session, userId };
}

export async function GET() {
  const { userId } = await actor();
  if (!userId) return NextResponse.json({ error: 'Sign in required - MLS connects to your realtor account.' }, { status: 401 });
  return NextResponse.json(await getMlsStatus(userId));
}

export async function POST(request: NextRequest) {
  const { session, userId } = await actor();
  if (!userId) return NextResponse.json({ error: 'Sign in required - MLS connects to your realtor account.' }, { status: 401 });
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const { mlsUsername, secret } = body || {};
  if (!mlsUsername || !secret) return NextResponse.json({ error: 'mlsUsername and secret (MLS password / API token) required' }, { status: 400 });
  const slug = await getActiveWorkspaceSlug(session);
  const ws = await prisma.workspace.findUnique({ where: { slug } }).catch(() => null);
  try {
    await saveMlsCredential(userId, ws?.id || slug, String(mlsUsername), String(secret));
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Could not store credentials.' }, { status: 500 });
  }
  const test = await testMlsConnection(userId);
  const status = await getMlsStatus(userId);
  return NextResponse.json({ ...status, test });
}

export async function DELETE() {
  const { userId } = await actor();
  if (!userId) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  await disconnectMls(userId);
  return NextResponse.json({ connected: false, status: 'not_connected' });
}
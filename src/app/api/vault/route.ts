import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';

/**
 * API Key Vault — securely stores LLM provider keys (AES-256-GCM encrypted).
 * GET: list configured providers (keys masked)
 * POST: store/update a key
 * DELETE: remove a key
 */

async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const provider = url.searchParams.get('provider');

  if (provider) {
    const apiKey = await prisma.apiKey.findUnique({ where: { provider } });
    return NextResponse.json({ provider, exists: !!apiKey });
  }

  const allKeys = await prisma.apiKey.findMany({ select: { provider: true, createdAt: true, updatedAt: true } });
  return NextResponse.json({ configuredProviders: allKeys });
}

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { provider, key } = body;
    if (!provider || !key) return NextResponse.json({ error: 'Provider and key are required' }, { status: 400 });

    const encryptedKey = encrypt(key);
    const savedKey = await prisma.apiKey.upsert({
      where: { provider },
      update: { key: encryptedKey },
      create: { provider, key: encryptedKey },
    });

    return NextResponse.json({ success: true, message: `Key for ${provider} securely stored`, provider: savedKey.provider }, { status: 201 });
  } catch (error) {
    console.error('Error storing API key:', error);
    return NextResponse.json({ error: 'Failed to securely store API key' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const provider = url.searchParams.get('provider');
  if (!provider) return NextResponse.json({ error: 'Provider is required' }, { status: 400 });

  await prisma.apiKey.delete({ where: { provider } }).catch(() => {});
  return NextResponse.json({ success: true, message: `Key for ${provider} removed` });
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEFAULT_WORKSPACE_SLUG } from '@/lib/workspace-context';

/**
 * Voice Settings API
 * Persists per-workspace voice provider config (ElevenLabs / OpenAI / Simulation).
 * GET: fetch current settings.
 * PUT: upsert settings.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId') || DEFAULT_WORKSPACE_SLUG;

  const settings = await prisma.voiceSettings.findUnique({ where: { workspaceId } });

  // Mask API keys in response
  const masked = settings
    ? {
        provider: settings.provider,
        elevenLabsVoiceId: settings.elevenLabsVoiceId,
        openAiVoiceId: settings.openAiVoiceId,
        hasElevenLabsKey: !!settings.elevenLabsApiKey,
        hasOpenAiKey: !!settings.openAiApiKey,
      }
    : null;

  return NextResponse.json({ settings: masked });
}

export async function PUT(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { workspaceId, provider, elevenLabsApiKey, elevenLabsVoiceId, openAiApiKey, openAiVoiceId } = body;
  const wsId = workspaceId || DEFAULT_WORKSPACE_SLUG;

  // FK validation — workspaceId must exist or upsert create path throws P2003 → 500
  const workspace = await prisma.workspace.findUnique({ where: { id: wsId } });
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  // Build update data — only include fields that are provided
  const data: Record<string, unknown> = {};
  if (provider !== undefined) data.provider = provider;
  if (elevenLabsVoiceId !== undefined) data.elevenLabsVoiceId = elevenLabsVoiceId;
  if (openAiVoiceId !== undefined) data.openAiVoiceId = openAiVoiceId;
  // Only overwrite keys if new value provided (non-empty)
  if (elevenLabsApiKey) data.elevenLabsApiKey = elevenLabsApiKey;
  if (openAiApiKey) data.openAiApiKey = openAiApiKey;

  const settings = await prisma.voiceSettings.upsert({
    where: { workspaceId: wsId },
    update: data,
    create: {
      workspaceId: wsId,
      provider: provider || 'SIMULATION',
      elevenLabsApiKey: elevenLabsApiKey || null,
      elevenLabsVoiceId: elevenLabsVoiceId || null,
      openAiApiKey: openAiApiKey || null,
      openAiVoiceId: openAiVoiceId || 'alloy',
    },
  });

  return NextResponse.json({
    id: settings.id,
    provider: settings.provider,
    hasElevenLabsKey: !!settings.elevenLabsApiKey,
    hasOpenAiKey: !!settings.openAiApiKey,
    saved: true,
  });
}

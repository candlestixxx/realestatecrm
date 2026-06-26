import prisma from '@/lib/prisma';

export type VoiceConfig = {
  provider: 'OPENAI' | 'ELEVENLABS' | 'SIMULATION';
  elevenLabsApiKey?: string;
  elevenLabsVoiceId?: string;
  openAiApiKey?: string;
  openAiVoiceId?: string;
};

// DO NOT pass the raw env vars back to the client!
export async function getVoiceConfig(workspaceId: string): Promise<VoiceConfig> {
  const settings = await prisma.voiceSettings.findUnique({
    where: { workspaceId },
  });

  if (settings) {
    return {
      provider: settings.provider as 'OPENAI' | 'ELEVENLABS' | 'SIMULATION',
      elevenLabsApiKey: settings.elevenLabsApiKey || '',
      elevenLabsVoiceId: settings.elevenLabsVoiceId || 'pNInz6obpgDQGcFmaJcg',
      openAiApiKey: settings.openAiApiKey || '',
      openAiVoiceId: settings.openAiVoiceId || 'alloy',
    };
  }

  // Default fallback
  return {
    provider: 'SIMULATION',
    elevenLabsApiKey: '',
    elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJcg', // Default Adam
    openAiApiKey: '',
    openAiVoiceId: 'alloy',
  };
}

export async function saveVoiceConfig(workspaceId: string, config: VoiceConfig) {
  await prisma.voiceSettings.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      provider: config.provider,
      elevenLabsApiKey: config.elevenLabsApiKey,
      elevenLabsVoiceId: config.elevenLabsVoiceId,
      openAiApiKey: config.openAiApiKey,
      openAiVoiceId: config.openAiVoiceId,
    },
    update: {
      provider: config.provider,
      elevenLabsApiKey: config.elevenLabsApiKey,
      elevenLabsVoiceId: config.elevenLabsVoiceId,
      openAiApiKey: config.openAiApiKey,
      openAiVoiceId: config.openAiVoiceId,
    },
  });
}

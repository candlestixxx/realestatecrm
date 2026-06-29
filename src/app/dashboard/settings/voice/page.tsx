import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { VoiceSettingsClient } from '@/components/VoiceSettingsClient';
import { getVoiceConfig } from '@/lib/voice-config';

export const metadata: Metadata = {
  title: 'Voice & Speech Settings - Settings',
};

export default async function VoiceSettingsPage() {
  const session = await getServerSession(authOptions);
  let workspaceId = '';
  let config = null;

  try {
    const access = await requireWorkspaceAccess(session);
    workspaceId = access.workspaceId;
    config = await getVoiceConfig(workspaceId);
  } catch (e) {
    // Fail silently if unauthorized and let client handle
  }

  if (!config) {
    return <div>Unauthorized.</div>;
  }

  // NEVER send raw API keys to the client. Mask them so the user knows they exist.
  const safeConfig = {
    ...config,
    elevenLabsApiKey: config.elevenLabsApiKey ? '********' : '',
    openAiApiKey: config.openAiApiKey ? '********' : '',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6 select-none">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Voice & Speech Settings</h1>
          <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded font-bold uppercase tracking-wide">
            Automations
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Configure Text-to-Speech (TTS) and Speech-to-Text (STT) providers for the VoiceForge AI assistant.
        </p>
      </div>

      <VoiceSettingsClient initialConfig={safeConfig} />
    </div>
  );
}

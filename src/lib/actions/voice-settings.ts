'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { saveVoiceConfig, VoiceConfig } from '@/lib/voice-config';
import { revalidatePath } from 'next/cache';

export async function saveVoiceSettingsAction(config: VoiceConfig) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  await saveVoiceConfig(access.workspaceId, config);
  revalidatePath('/dashboard/settings/voice');

  return { success: true };
}

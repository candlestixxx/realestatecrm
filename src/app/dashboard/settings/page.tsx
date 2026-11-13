import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import prisma from '@/lib/prisma';
import { getEmailConfig } from '@/lib/email-config';
import { getVoiceConfig } from '@/lib/voice-config';
import SettingsTabs from '@/components/dashboard/SettingsTabs';

export const revalidate = 0;

/**
 * Consolidated single-page Settings Hub.
 *
 * Why: settings previously forced operators across 8 separate routes
 * (branding, team, integrations, email, voice, ai-models, ai-memory, mcp)
 * behind "Open full page ->" stubs. This server page preloads workspace-scoped
 * integration, email, and masked voice configs in parallel so all 10 settings
 * domains render interactively inline on `/dashboard/settings` while preserving
 * deep standalone routes for bookmarks.
 */
export default async function SettingsPage() {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    // fall through to redirect
  }
  if (!session) redirect('/api/auth/signin');
  const access = await requireWorkspaceAccess(session);
  const workspaceId = access.workspaceId || session.user?.workspaceId || 'default';

  const [integrationData, emailConfig, rawVoiceConfig] = await Promise.all([
    workspaceId && workspaceId !== 'default'
      ? prisma.myPlusLeadsIntegration.findFirst({ where: { workspaceId } }).catch(() => null)
      : Promise.resolve(null),
    getEmailConfig().catch(() => ({
      provider: 'SIMULATION' as const,
      fromEmail: 'info@excellegacyrealtygroup.site',
    })),
    getVoiceConfig(workspaceId).catch(() => null),
  ]);

  // Never send raw voice provider API keys to the browser; mask non-empty keys.
  const safeVoiceConfig = rawVoiceConfig
    ? {
        ...rawVoiceConfig,
        elevenLabsApiKey: rawVoiceConfig.elevenLabsApiKey ? '********' : '',
        openAiApiKey: rawVoiceConfig.openAiApiKey ? '********' : '',
      }
    : null;

  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading settings console...</div>}>
      <SettingsTabs
        workspaceId={workspaceId}
        integrationData={integrationData}
        emailConfig={emailConfig}
        voiceConfig={safeVoiceConfig}
      />
    </Suspense>
  );
}

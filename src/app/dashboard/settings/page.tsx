import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import SettingsTabs from '@/components/dashboard/SettingsTabs';

/**
 * Consolidated settings hub.
 *
 * Why: settings were split across 5 separate routes (email, voice,
 * ai-models, mcp, integrations) with no index, forcing operators to
 * memorize URLs. This page tabs all of them into one surface while
 * keeping the deep routes working for bookmarks and external links.
 */
export default async function SettingsPage() {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    // fall through to redirect
  }
  if (!session) redirect('/api/auth/signin');
  await requireWorkspaceAccess(session);

  return <SettingsTabs />;
}

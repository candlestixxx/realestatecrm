import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import CommandCenter from '@/components/dashboard/CommandCenter';

/**
 * Dashboard home is now the unified Command Center.
 *
 * Why: previously this page only showed four stat cards and pushed users
 * into 26+ separate routes. The Command Center surfaces every feature in
 * the product on one page, ordered by business value, with guidance
 * tooltips. Deep links still work — this is the single entry point.
 */
export default async function DashboardHome() {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (err) {
    console.warn('Session decryption failed on dashboard page:', err);
  }

  if (!session) {
    redirect('/api/auth/signin');
  }

  // Validates workspace membership; throws/redirects if the user has no access.
  await requireWorkspaceAccess(session);

  return <CommandCenter />;
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import { buildDashboardCards, listCrmRecords, seedCrmRecordsIfEmpty } from '@/lib/crm-records';
import { requireWorkspaceAccess, WorkspaceAccessError } from '@/lib/workspace-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * CRM Records API.
 *
 * Auth is checked before any DB mutation: `seedCrmRecordsIfEmpty` used to run
 * unconditionally, which let anonymous callers trigger writes. The route also
 * previously let `WorkspaceAccessError` bubble to Next's default 500 handler;
 * it now maps the built-in `statusCode` (401/403) so clients get the correct
 * signal instead of a generic server error.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const access = await requireWorkspaceAccess(session);
    // Seed only after auth — never mutate the DB for anonymous callers.
    await seedCrmRecordsIfEmpty();
    const records = await listCrmRecords({ workspaceSlug: access.workspaceSlug });

    return NextResponse.json({
      count: records.length,
      records: buildDashboardCards(records),
    });
  } catch (err) {
    if (err instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('crm-records GET failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

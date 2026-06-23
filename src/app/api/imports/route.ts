import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { AppRole, isAtLeastRole } from '@/lib/permissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/imports — Get import history and stats
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  await requireWorkspaceAccess(session);

  // Read import history from the data directory
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const historyPath = path.default.join(process.cwd(), 'data', 'import-history.json');

  let history: any[] = [];
  try {
    const raw = await fs.readFile(historyPath, 'utf8');
    history = JSON.parse(raw);
  } catch {
    history = [];
  }

  // Get today's import count
  const today = new Date().toISOString().split('T')[0];
  const todayImports = history.filter((h: any) => h.timestamp?.startsWith(today));

  return NextResponse.json({
    history: history.slice(-20).reverse(),
    todayCount: todayImports.length,
  });
}

/**
 * POST /api/imports — Actions:
 *   { action: "schedule", listType: "Expired", csvPath: "..." } — schedule a file for import
 *   { action: "importFromData", listType: "Expired" } — import from a known data file
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
  }

  const body = await req.json();
  const { action } = body;

  switch (action) {
    case 'importCsvFromPath': {
      const { csvPath, listType } = body as { csvPath: string; listType: string };

      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      const fullPath = path.default.resolve(process.cwd(), csvPath);

      try {
        const text = await fs.readFile(fullPath, 'utf8');

        // Parse and import using the shared CSV parser logic
        const { importCsvAction } = await import('@/lib/actions/imports');

        // Create a FormData-like structure
        const formData = new FormData();
        const blob = new Blob([text], { type: 'text/csv' });
        const fileName = path.default.basename(fullPath);
        const file = new File([blob], fileName, { type: 'text/csv' });
        formData.append('file', file);
        formData.append('listType', listType || 'Expired');

        const result = await importCsvAction(formData);

        // Log to import history
        const historyPath = path.default.join(process.cwd(), 'data', 'import-history.json');
        let history: any[] = [];
        try {
          const raw = await fs.readFile(historyPath, 'utf8');
          history = JSON.parse(raw);
        } catch {
          history = [];
        }

        history.push({
          timestamp: new Date().toISOString(),
          listType: listType || 'Expired',
          fileName: fileName,
          total: result.total || 0,
          imported: result.imported || 0,
          skipped: result.skipped || 0,
          errors: result.errors?.length || 0,
          status: result.imported > 0 ? 'success' : 'empty',
        });

        await fs.writeFile(historyPath, JSON.stringify(history, null, 2), 'utf8');

        return NextResponse.json(result);
      } catch (err) {
        return NextResponse.json({
          success: false,
          imported: 0,
          skipped: 0,
          errors: [err instanceof Error ? err.message : 'File read error'],
          total: 0,
        });
      }
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}

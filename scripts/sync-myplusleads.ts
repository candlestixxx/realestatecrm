// ─── Local MyPlus Leads Sync Runner ─────────────────────────────────────────
//
// Usage:  npx tsx scripts/sync-myplusleads.ts
//         or add to npm scripts: "sync:myplus": "tsx scripts/sync-myplusleads.ts"
//
// This script calls the internal cron endpoint to trigger a MyPlus sync.
// It's useful for local development or as a scheduled task via Windows Task
// Scheduler / cron.
// ───────────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET;

async function main() {
  console.log(`🔄 Triggering MyPlus Leads sync at ${new Date().toLocaleTimeString()}...`);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (CRON_SECRET) {
    headers['Authorization'] = `Bearer ${CRON_SECRET}`;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/cron/myplusleads`, { headers });
    const data = await res.json();

    if (!res.ok) {
      console.error(`❌ Sync failed (${res.status}):`, data.error || data.message || 'Unknown error');
      process.exit(1);
    }

    console.log(`✅ ${data.message}`);
    if (data.results) {
      for (const r of data.results) {
        const icon = r.status === 'success' ? '✅' : '❌';
        console.log(`   ${icon} Workspace ${r.workspaceId}: ${r.processedCount} imported, ${r.skippedCount} skipped${r.error ? ` — ${r.error}` : ''}`);
      }
    }

    process.exit(0);
  } catch (err: any) {
    console.error(`❌ Could not reach the server at ${BASE_URL}. Is the dev server running?`);
    console.error(`   Error: ${err.message}`);
    process.exit(1);
  }
}

main();

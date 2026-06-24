// ─── Local MyPlus Sync Scheduler ───────────────────────────────────────────
//
// Runs inside the Next.js dev server. Every 15 minutes between 4:00-7:00 AM,
// it triggers the MyPlus Leads sync if an active integration is configured.
//
// Imported in: src/app/dashboard/layout.tsx (runs server-side)
// ───────────────────────────────────────────────────────────────────────────

const SYNC_WINDOW_START = 4;  // 4:00 AM
const SYNC_WINDOW_END = 7;    // 7:00 AM (last sync at 6:59)
const CHECK_INTERVAL_MS = 15 * 60 * 1000; // every 15 minutes

let schedulerStarted = false;
let lastSyncDate: string | null = null;

/**
 * Start the local sync scheduler.
 * Must be called from a server context (layout.tsx, not client component).
 */
export function startSyncScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  console.log('[MyPlus Scheduler] Started — will sync between 4-7 AM daily');

  const tick = async () => {
    try {
      const now = new Date();
      const hour = now.getHours();
      const today = now.toISOString().split('T')[0];

      // Only run between 4-7 AM and only once per day
      if (hour >= SYNC_WINDOW_START && hour < SYNC_WINDOW_END && lastSyncDate !== today) {
        console.log(`[MyPlus Scheduler] Time window hit (${hour}:00). Triggering sync...`);

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const cronSecret = process.env.CRON_SECRET;

        const headers: Record<string, string> = {};
        if (cronSecret) {
          headers['Authorization'] = `Bearer ${cronSecret}`;
        }

        const res = await fetch(`${baseUrl}/api/cron/myplusleads`, {
          headers,
          signal: AbortSignal.timeout(120_000),
        });

        const data = await res.json();
        console.log(`[MyPlus Scheduler] Sync result: ${data.message || JSON.stringify(data)}`);
        lastSyncDate = today;
      }
    } catch (err: any) {
      // Silently ignore errors (server might not be ready, etc.)
      if (err.name !== 'AbortError') {
        console.error('[MyPlus Scheduler] Sync attempt failed:', err.message);
      }
    }
  };

  // Run immediately on start (in case server starts during sync window)
  tick();

  // Then check every 15 minutes
  setInterval(tick, CHECK_INTERVAL_MS);
}

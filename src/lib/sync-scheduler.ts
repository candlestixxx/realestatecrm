// ─── Local MyPlus Sync Scheduler ───────────────────────────────────────────
//
// Runs inside the Next.js dev server. Triggers MyPlus Leads sync:
// - Every 15 minutes between 4:00-7:00 AM (high-frequency morning drop window)
// - Every 1 hour during the rest of the day to fetch straggler leads periodically
//
// Imported in: src/app/dashboard/layout.tsx (runs server-side)
// ───────────────────────────────────────────────────────────────────────────

const SYNC_WINDOW_START = 4;  // 4:00 AM
const SYNC_WINDOW_END = 7;    // 7:00 AM
const CHECK_INTERVAL_MS = 15 * 60 * 1000; // every 15 minutes

let schedulerStarted = false;
let lastSyncTimeMs = 0;

/**
 * Start the local sync scheduler.
 * Must be called from a server context (layout.tsx, not client component).
 */
export function startSyncScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  console.log('[MyPlus Scheduler] Started — morning drops synced (4-7 AM) and stragglers synced hourly');

  const tick = async () => {
    try {
      const now = new Date();
      const hour = now.getHours();
      const nowMs = now.getTime();

      const timeSinceLastSync = nowMs - lastSyncTimeMs;
      const fifteenMinsMs = 15 * 60 * 1000;

      // Run sync every 15 minutes all day long to deliver leads as soon as they are posted
      if (timeSinceLastSync >= fifteenMinsMs) {
        console.log(`[MyPlus Scheduler] Triggering sync (lastSync: ${lastSyncTimeMs > 0 ? new Date(lastSyncTimeMs).toLocaleTimeString() : 'never'})...`);

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
        lastSyncTimeMs = nowMs;
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

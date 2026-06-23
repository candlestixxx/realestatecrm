'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type SyncStatus =
  | 'QUEUED'
  | 'FINDING'
  | 'SYNCING'
  | 'SYNCED'
  | 'FAILED'
  | 'SKIPPED';

type SyncQueueItem = {
  id: string;
  leadId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  assignedAgent: string | null;
  status: SyncStatus;
  myplusPortalUrl: string | null;
  loftyContactId: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
};

type SyncPlan = {
  step1_search: string;
  step2_action: string;
  step3_verify: string;
};

type QueueStats = {
  total: number;
  queued: number;
  syncing: number;
  synced: number;
  failed: number;
  skipped: number;
};

type Readiness = {
  readyForLeadTesting: boolean;
  blockers: string[];
  checklist: Array<{ id: string; label: string; description: string }>;
  nextAction: string;
};

type LoftyVerification = {
  ok: boolean;
  resultCount?: number;
  error?: string;
};

// ─── Status badge colors ─────────────────────────────────────────────────────

const statusStyles: Record<SyncStatus, string> = {
  QUEUED: 'bg-secondary/20 text-secondary-foreground border-secondary/30',
  FINDING: 'bg-amber-500/20 text-amber-600 border-amber-500/30',
  SYNCING: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
  SYNCED: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30',
  FAILED: 'bg-red-500/20 text-red-600 border-red-500/30',
  SKIPPED: 'bg-muted text-muted-foreground border-border',
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SyncQueuePage() {
  const [items, setItems] = useState<SyncQueueItem[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [activeItem, setActiveItem] = useState<SyncQueueItem | null>(null);
  const [syncPlan, setSyncPlan] = useState<SyncPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [loftyIdInput, setLoftyIdInput] = useState('');
  const [loftyApiKey, setLoftyApiKey] = useState('');
  const [loftyVerification, setLoftyVerification] = useState<LoftyVerification | null>(null);
  const [myplusConfirmed, setMyplusConfirmed] = useState(false);
  const [filter, setFilter] = useState<SyncStatus | 'ALL'>('ALL');

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/sync-queue');
      const data = await res.json();
      setItems(data.items);
      setStats(data.stats);
      setReadiness(data.readiness ?? null);
    } catch (err) {
      console.error('Failed to fetch sync queue:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // initial async load for client-only queue data.
    fetchQueue();
  }, [fetchQueue]);

  const handleVerifyLoftyKey = async () => {
    setActionLoading('verify-lofty');
    setLoftyVerification(null);
    try {
      const res = await fetch('/api/sync-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verifyLoftyKey',
          apiKey: loftyApiKey,
          query: activeItem ? `${activeItem.firstName} ${activeItem.lastName}` : 'Danette Colbert',
          myplusIntegrationConfirmed: myplusConfirmed,
        }),
      });
      const data = await res.json();
      setLoftyVerification({
        ok: Boolean(data.ok && res.ok),
        resultCount: data.resultCount,
        error: data.error,
      });
      if (data.readiness) setReadiness(data.readiness);
    } catch (err) {
      setLoftyVerification({ ok: false, error: 'Lofty verification request failed.' });
      console.error('Lofty verification failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyActiveLead = async (id: string) => {
    setActionLoading(`verify-${id}`);
    try {
      const res = await fetch('/api/sync-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verifyLead', id, apiKey: loftyApiKey }),
      });
      const data = await res.json();
      if (data.found) {
        setLoftyIdInput(data.contactId ?? 'verified');
      } else if (!res.ok) {
        setLoftyVerification({ ok: false, error: data.error ?? 'Lofty verification failed.' });
      } else {
        setLoftyVerification({ ok: false, error: 'Lead not found in Lofty yet.' });
      }
    } catch (err) {
      setLoftyVerification({ ok: false, error: 'Lead verification request failed.' });
      console.error('Lead verification failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Enqueue all preforeclosure leads ─────────────────────────────────────

  const handleEnqueueAll = async () => {
    setActionLoading('enqueue');
    try {
      const res = await fetch('/api/sync-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enqueue' }),
      });
      const data = await res.json();
      setStats(data.queueStats);
      await fetchQueue();
    } catch (err) {
      console.error('Enqueue failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Get next lead to sync ────────────────────────────────────────────────

  const handleGetNext = async () => {
    setActionLoading('next');
    try {
      const res = await fetch('/api/sync-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'next' }),
      });
      const data = await res.json();
      if (data.item) {
        setActiveItem(data.item);
        setSyncPlan(data.plan);
      }
    } catch (err) {
      console.error('Get next failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Start sync (mark as finding in MyPlus) ──────────────────────────────

  const handleStartSync = async (id: string) => {
    setActionLoading(`start-${id}`);
    try {
      await fetch('/api/sync-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'startSync', id }),
      });
      await fetchQueue();
    } catch (err) {
      console.error('Start sync failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Complete sync ────────────────────────────────────────────────────────

  const handleCompleteSync = async (id: string) => {
    setActionLoading(`complete-${id}`);
    try {
      await fetch('/api/sync-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'completeSync',
          id,
          loftyContactId: loftyIdInput || 'verified',
        }),
      });
      setLoftyIdInput('');
      setActiveItem(null);
      setSyncPlan(null);
      await fetchQueue();
    } catch (err) {
      console.error('Complete sync failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Fail sync ────────────────────────────────────────────────────────────

  const handleFailSync = async (id: string, error: string) => {
    setActionLoading(`fail-${id}`);
    try {
      await fetch('/api/sync-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'failSync', id, error }),
      });
      await fetchQueue();
    } catch (err) {
      console.error('Fail sync failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Skip lead ────────────────────────────────────────────────────────────

  const handleSkip = async (id: string) => {
    setActionLoading(`skip-${id}`);
    try {
      await fetch('/api/sync-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'skip', id }),
      });
      await fetchQueue();
    } catch (err) {
      console.error('Skip failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Filtered items ──────────────────────────────────────────────────────

  const filteredItems =
    filter === 'ALL' ? items : items.filter((i) => i.status === filter);

  // ─── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-4 bg-muted rounded w-96" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MyPlus → Lofty Sync Queue</h1>
          <p className="text-muted-foreground">
            One-at-a-time lead sync from MyPlus portal into Lofty CRM.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleEnqueueAll}
            disabled={actionLoading === 'enqueue'}
            className="px-4 py-2 bg-muted text-foreground font-medium rounded-md hover:bg-muted/80 transition-colors disabled:opacity-50"
          >
            {actionLoading === 'enqueue' ? 'Adding...' : 'Enqueue All Preforeclosure'}
          </button>
          <button
            onClick={handleGetNext}
            disabled={actionLoading === 'next' || stats?.queued === 0}
            className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {actionLoading === 'next' ? 'Loading...' : '▶ Start Next Sync'}
          </button>
        </div>
      </div>

      {/* Integration Readiness */}
      {readiness && (
        <div className="rounded-xl border border-border bg-background p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Integration readiness</h2>
              <p className="text-sm text-muted-foreground">
                Verify the fresh Lofty key and confirm the native MyPlus Chime/Lofty integration before testing the 21-lead queue.
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border self-start ${
                readiness.readyForLeadTesting
                  ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-700 border-amber-500/30'
              }`}
            >
              {readiness.readyForLeadTesting ? 'Ready for lead testing' : 'Needs verification'}
            </span>
          </div>

          {readiness.blockers.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800">
              <div className="font-semibold mb-1">Blockers</div>
              <ul className="list-disc pl-5 space-y-1">
                {readiness.blockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            {readiness.checklist.map((step) => (
              <div key={step.id} className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="text-sm font-semibold">{step.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{step.description}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_auto] items-end">
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Fresh Lofty API key</span>
              <input
                type="password"
                value={loftyApiKey}
                onChange={(e) => setLoftyApiKey(e.target.value)}
                placeholder="Paste key here to verify; it is not saved in the browser UI"
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </label>
            <button
              onClick={handleVerifyLoftyKey}
              disabled={actionLoading === 'verify-lofty'}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50"
            >
              {actionLoading === 'verify-lofty' ? 'Verifying...' : 'Verify Lofty Key'}
            </button>
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={myplusConfirmed}
              onChange={(e) => setMyplusConfirmed(e.target.checked)}
              className="mt-1"
            />
            <span>
              I confirmed MyPlus Settings → Data Integrations has Chime/Lofty active with the current Lofty key.
            </span>
          </label>

          {loftyVerification && (
            <div
              className={`rounded-lg border p-3 text-sm ${
                loftyVerification.ok
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
                  : 'border-red-500/30 bg-red-500/10 text-red-700'
              }`}
            >
              {loftyVerification.ok
                ? `Lofty key verified. Search returned ${loftyVerification.resultCount ?? 0} lead(s).`
                : loftyVerification.error ?? 'Lofty verification failed.'}
            </div>
          )}

          <p className="text-xs text-muted-foreground">Next: {readiness.nextAction}</p>
        </div>
      )}

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {([
            ['Total', stats.total, 'bg-muted'],
            ['Queued', stats.queued, 'bg-secondary/20'],
            ['Syncing', stats.syncing, 'bg-amber-500/20'],
            ['Synced', stats.synced, 'bg-emerald-500/20'],
            ['Failed', stats.failed, 'bg-red-500/20'],
            ['Skipped', stats.skipped, 'bg-muted/50'],
          ] as const).map(([label, count, bg]) => (
            <div
              key={label}
              className={`${bg} rounded-lg p-3 text-center border border-border`}
            >
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Active Sync Panel */}
      {activeItem && syncPlan && (
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-primary">
              🔵 Active Sync: {activeItem.firstName} {activeItem.lastName}
            </h2>
            <button
              onClick={() => {
                setActiveItem(null);
                setSyncPlan(null);
              }}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              ✕ Close
            </button>
          </div>

          {/* Sync Plan Steps */}
          <div className="space-y-3 bg-background rounded-lg p-4 border border-border">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">
              One-at-a-Time Sync Plan
            </h3>
            <ol className="space-y-2 text-sm">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span>{syncPlan.step1_search}</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <span>{syncPlan.step2_action}</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <span>{syncPlan.step3_verify}</span>
              </li>
            </ol>
          </div>

          {/* Lead Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Email:</span>{' '}
              {activeItem.email ?? '—'}
            </div>
            <div>
              <span className="text-muted-foreground">Phone:</span>{' '}
              {activeItem.phone ?? '—'}
            </div>
            <div>
              <span className="text-muted-foreground">Source:</span>{' '}
              {activeItem.source ?? '—'}
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>{' '}
              <span className={`px-2 py-0.5 text-xs rounded-full font-medium border ${statusStyles[activeItem.status]}`}>
                {activeItem.status}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={`https://portal.myplusleads.com/leads?search=${encodeURIComponent(`${activeItem.firstName} ${activeItem.lastName}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleStartSync(activeItem.id)}
              className="px-4 py-2 bg-amber-500/20 text-amber-700 border border-amber-500/30 rounded-md hover:bg-amber-500/30 transition-colors text-sm font-medium"
            >
              Open in MyPlus →
            </a>

            <button
              onClick={() => handleVerifyActiveLead(activeItem.id)}
              disabled={actionLoading === `verify-${activeItem.id}`}
              className="px-4 py-2 bg-blue-500/20 text-blue-700 border border-blue-500/30 rounded-md hover:bg-blue-500/30 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {actionLoading === `verify-${activeItem.id}` ? 'Checking Lofty...' : 'Verify in Lofty'}
            </button>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={loftyIdInput}
                onChange={(e) => setLoftyIdInput(e.target.value)}
                placeholder="Lofty Contact ID (optional)"
                className="px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={() => handleCompleteSync(activeItem.id)}
                disabled={actionLoading === `complete-${activeItem.id}`}
                className="px-4 py-2 bg-emerald-500/20 text-emerald-700 border border-emerald-500/30 rounded-md hover:bg-emerald-500/30 transition-colors text-sm font-medium disabled:opacity-50"
              >
                ✓ Mark Synced
              </button>
            </div>

            <button
              onClick={() =>
                handleFailSync(activeItem.id, 'Manual fail — lead not found in MyPlus or sync error')
              }
              disabled={actionLoading === `fail-${activeItem.id}`}
              className="px-4 py-2 bg-red-500/20 text-red-700 border border-red-500/30 rounded-md hover:bg-red-500/30 transition-colors text-sm font-medium disabled:opacity-50"
            >
              ✕ Mark Failed
            </button>

            <button
              onClick={() => handleSkip(activeItem.id)}
              disabled={actionLoading === `skip-${activeItem.id}`}
              className="px-4 py-2 bg-muted text-muted-foreground border border-border rounded-md hover:bg-muted/80 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'QUEUED', 'FINDING', 'SYNCED', 'FAILED', 'SKIPPED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 text-xs rounded-full font-medium border transition-colors ${
              filter === s
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
            }`}
          >
            {s}
            {s === 'ALL' && stats ? ` (${stats.total})` : ''}
            {s === 'QUEUED' && stats ? ` (${stats.queued})` : ''}
            {s === 'SYNCED' && stats ? ` (${stats.synced})` : ''}
            {s === 'FAILED' && stats ? ` (${stats.failed})` : ''}
          </button>
        ))}
      </div>

      {/* Queue Table */}
      <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Agent</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Synced At</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium">
                    {item.firstName} {item.lastName}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span>{item.email ?? '—'}</span>
                      <span className="text-xs text-muted-foreground">{item.phone ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.assignedAgent ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium border ${statusStyles[item.status]}`}
                    >
                      {item.status}
                    </span>
                    {item.error && (
                      <div className="text-xs text-red-500 mt-1 max-w-[200px] truncate">{item.error}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {item.syncedAt ? new Date(item.syncedAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      {item.status === 'QUEUED' && (
                        <>
                          <button
                            onClick={() => {
                              setActiveItem(item);
                              setSyncPlan({
                                step1_search: `Open https://portal.myplusleads.com/leads?search=${encodeURIComponent(`${item.firstName} ${item.lastName}`)} and find "${item.firstName} ${item.lastName}"`,
                                step2_action: 'Open the lead, save the contact note/disposition, then use Data Integration Logs / provider surface and choose Lofty (not Zapier). Confirm the sync modal if prompted.',
                                step3_verify: 'Verify the MyPlus history shows "Lofty - Synchronized", then confirm the lead appears in Lofty CRM under the correct agent.',
                              });
                            }}
                            className="text-primary hover:underline text-xs font-medium"
                          >
                            Sync
                          </button>
                          <button
                            onClick={() => handleSkip(item.id)}
                            className="text-muted-foreground hover:text-foreground text-xs"
                          >
                            Skip
                          </button>
                        </>
                      )}
                      {item.status === 'FINDING' && (
                        <a
                          href={`https://portal.myplusleads.com/leads?search=${encodeURIComponent(`${item.firstName} ${item.lastName}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-600 hover:underline text-xs font-medium"
                        >
                          Open MyPlus →
                        </a>
                      )}
                      {item.status === 'SYNCED' && item.loftyContactId && (
                        <span className="text-emerald-600 text-xs">✓ {item.loftyContactId}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    {items.length === 0
                      ? 'No leads in sync queue. Click "Enqueue All Preforeclosure" to start.'
                      : 'No leads match this filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

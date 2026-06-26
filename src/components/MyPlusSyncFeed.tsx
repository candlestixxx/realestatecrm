'use client';

import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type SyncLog = {
  id: string;
  startedAt: string;
  completedAt: string | null;
  status: 'running' | 'success' | 'error';
  listingsFound: number;
  importedCount: number;
  skippedCount: number;
  errorMessage: string | null;
};

type SyncState = {
  integration: {
    isActive: boolean;
    lastSyncAt: string | null;
    lastID: string | null;
    email: string;
  } | null;
  logs: SyncLog[];
};

export function MyPlusSyncFeed() {
  const [state, setState] = useState<SyncState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadSyncHistory() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/sync-history?limit=5');
      if (!res.ok) throw new Error('Failed to load sync history');
      const data = await res.json();
      setState(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSyncHistory();
  }, []);

  if (loading) {
    return (
      <div className="bg-background border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading sync status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background border border-border rounded-2xl p-5 shadow-sm">
        <p className="text-sm text-red-500">Could not load MyPlus sync info.</p>
      </div>
    );
  }

  if (!state || !state.integration) {
    return (
      <div className="bg-background border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">MyPlus Leads Sync</h3>
          <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded font-bold uppercase">
            Not Configured
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Go to Integrations settings to set up your MyPlus Leads account for daily Expired/FSBO and Neighborhood Data sync.
        </p>
        <Link
          href="/dashboard/settings/integrations"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Configure Now <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  const lastSync = state.integration.lastSyncAt
    ? new Date(state.integration.lastSyncAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Never';

  const latestLog = state.logs[0];

  return (
    <div className="bg-background border border-border rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm">MyPlus Leads Sync</h3>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase">
            {state.integration.isActive ? 'Active' : 'Paused'}
          </span>
        </div>
        <button
          onClick={loadSyncHistory}
          className="p-1.5 hover:bg-muted rounded-md transition-colors"
          title="Refresh"
        >
          <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Status info */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-muted/20 rounded-lg p-2.5">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">Last Sync</p>
          <p className="text-sm font-semibold mt-0.5">{lastSync}</p>
        </div>
        <div className="bg-muted/20 rounded-lg p-2.5">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">Account</p>
          <p className="text-sm font-semibold mt-0.5 truncate">{state.integration.email}</p>
        </div>
      </div>

      {/* Latest sync result */}
      {latestLog && (
        <div className={`rounded-lg p-3 border ${
          latestLog.status === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' :
          latestLog.status === 'error' ? 'bg-red-500/5 border-red-500/20' :
          'bg-amber-500/5 border-amber-500/20'
        }`}>
          <div className="flex items-center gap-2 mb-1.5">
            {latestLog.status === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : latestLog.status === 'error' ? (
              <XCircle className="h-4 w-4 text-red-500" />
            ) : (
              <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
            )}
            <span className="text-xs font-bold uppercase">
              {latestLog.status === 'success' ? 'Synced Successfully' :
               latestLog.status === 'error' ? 'Sync Failed' : 'Sync in Progress'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground ml-6">
            <span>📥 {latestLog.importedCount} imported</span>
            <span>⏭️ {latestLog.skippedCount} skipped</span>
            <span>📋 {latestLog.listingsFound} found</span>
          </div>
          {latestLog.errorMessage && (
            <p className="text-xs text-red-500 mt-1 ml-6">{latestLog.errorMessage}</p>
          )}
          <p className="text-[10px] text-muted-foreground mt-1 ml-6">
            {new Date(latestLog.startedAt).toLocaleString()}
          </p>
        </div>
      )}

      {/* View all link */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          Imports Expired/FSBO + Neighborhood Data leads automatically
        </p>
        <Link
          href="/dashboard/settings/integrations"
          className="text-xs font-semibold text-primary hover:underline"
        >
          Settings
        </Link>
      </div>
    </div>
  );
}

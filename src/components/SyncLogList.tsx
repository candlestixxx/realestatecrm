import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';

type SyncLogItem = {
  id: string;
  startedAt: Date;
  completedAt: Date | null;
  status: string;
  listingsFound: number;
  importedCount: number;
  skippedCount: number;
  errorMessage: string | null;
};

export function SyncLogList({ logs }: { logs: SyncLogItem[] }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No syncs have run yet.</p>
        <p className="text-xs mt-1">Click <strong>Sync Now</strong> above or wait for the morning auto-sync.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => {
        const started = new Date(log.startedAt);
        const completed = log.completedAt ? new Date(log.completedAt) : null;
        const duration = completed
          ? Math.round((completed.getTime() - started.getTime()) / 1000)
          : null;

        return (
          <div
            key={log.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              log.status === 'success' ? 'bg-emerald-500/5 border-emerald-500/15' :
              log.status === 'error' ? 'bg-red-500/5 border-red-500/15' :
              'bg-amber-500/5 border-amber-500/15'
            }`}
          >
            {/* Left: Status icon + timestamp */}
            <div className="flex items-center gap-3">
              {log.status === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              ) : log.status === 'error' ? (
                <XCircle className="h-5 w-5 text-red-500 shrink-0" />
              ) : (
                <Loader2 className="h-5 w-5 text-amber-500 animate-spin shrink-0" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase ${
                    log.status === 'success' ? 'text-emerald-600' :
                    log.status === 'error' ? 'text-red-600' :
                    'text-amber-600'
                  }`}>
                    {log.status === 'success' ? 'Success' :
                     log.status === 'error' ? 'Failed' :
                     'Running'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {started.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                  {duration !== null && (
                    <span className="text-[10px] text-muted-foreground">
                      ({duration}s)
                    </span>
                  )}
                </div>
                {log.errorMessage && (
                  <p className="text-xs text-red-500 mt-0.5">{log.errorMessage}</p>
                )}
              </div>
            </div>

            {/* Right: Counts */}
            <div className="flex items-center gap-4 text-xs shrink-0">
              <div className="text-center">
                <p className="font-bold text-sm">{log.listingsFound}</p>
                <p className="text-[10px] text-muted-foreground">Found</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-sm text-emerald-600">{log.importedCount}</p>
                <p className="text-[10px] text-muted-foreground">Imported</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-sm text-muted-foreground">{log.skippedCount}</p>
                <p className="text-[10px] text-muted-foreground">Skipped</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

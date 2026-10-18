'use client';

// ServiceHealthGrid — real-time status of all 9 sub-services.
// Why: operators need at-a-glance visibility into which services are up/down
// without leaving the dashboard. Polls each service every 30 seconds.

import { useEffect, useState } from 'react';

interface ServiceStatus {
  name: string;
  port: number;
  url: string;
  status: 'checking' | 'up' | 'down';
  code?: number;
}

const SERVICES: Omit<ServiceStatus, 'status' | 'code'>[] = [
  { name: 'Main CRM', port: 3210, url: '/api/health' },
  { name: 'LeadG', port: 3211, url: process.env.NEXT_PUBLIC_LEADG_URL || 'http://localhost:3000' },
  { name: 'Foreclosure', port: 3212, url: process.env.NEXT_PUBLIC_FORECLOSURE_URL || 'http://localhost:3007' },
  { name: 'ContentPlanner', port: 3003, url: process.env.NEXT_PUBLIC_CONTENT_PLANNER_URL || 'http://localhost:3003' },
  { name: 'ContentPlanner API', port: 3031, url: process.env.NEXT_PUBLIC_CONTENT_PLANNER_API_URL || 'http://localhost:3031' },
  { name: 'MediaWorkflow', port: 3004, url: process.env.NEXT_PUBLIC_MEDIA_WORKFLOW_URL || 'http://localhost:3004' },
  { name: 'LegacyLeads Web', port: 3005, url: process.env.NEXT_PUBLIC_LEGACY_LEADS_URL || 'http://localhost:3005' },
  { name: 'LegacyLeads API', port: 3006, url: process.env.NEXT_PUBLIC_LEGACY_LEADS_API_URL || 'http://localhost:3006' },
  { name: 'Live Audio', port: 8090, url: process.env.NEXT_PUBLIC_LIVE_AUDIO_URL || 'http://localhost:8090' },
];

export default function ServiceHealthGrid() {
  const [dataLoading, setDataLoading] = useState(true);
  const [services, setServices] = useState<ServiceStatus[]>(
    SERVICES.map(s => ({ ...s, status: 'checking' as const }))
  );

  useEffect(() => {
    let cancelled = false;

    async function checkAll() {
      const results = await Promise.all(
        SERVICES.map(async (svc) => {
          try {
            const res = await fetch(svc.url, {
              method: 'HEAD',
              mode: 'no-cors',
              signal: AbortSignal.timeout(5000),
            });
            return { ...svc, status: 'up' as const, code: res.status };
          } catch {
            // no-cors HEAD may "fail" even when service is up — try GET
            try {
              await fetch(svc.url, { signal: AbortSignal.timeout(5000) });
              return { ...svc, status: 'up' as const };
            } catch {
              return { ...svc, status: 'down' as const };
            }
          }
        })
      );
      if (!cancelled) setServices(results);
    }

    checkAll();
    const interval = setInterval(checkAll, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const upCount = services.filter(s => s.status === 'up').length;

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Service Health</h3>
        <span className={'text-xs px-2 py-1 rounded-full ' + (upCount === services.length ? 'bg-green-100 text-green-700' : upCount > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')}>
          {upCount}/{services.length} online
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {services.map((svc) => (
          <div
            key={svc.port}
            className="flex items-center gap-2 px-2 py-1.5 rounded text-xs border"
            title={svc.name + ' on port ' + svc.port}
          >
            <span
              className={
                'w-2 h-2 rounded-full flex-shrink-0 ' +
                (svc.status === 'up'
                  ? 'bg-green-500'
                  : svc.status === 'down'
                  ? 'bg-red-500'
                  : 'bg-yellow-400 animate-pulse')
              }
            />
            <span className="text-foreground truncate">{svc.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

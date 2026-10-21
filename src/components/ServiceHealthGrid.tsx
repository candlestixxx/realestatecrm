'use client';

// ServiceHealthGrid — real-time status of the deployed sub-services.
//
// Why: operators need at-a-glance visibility into which services are up/down
// without leaving the dashboard. Polls each service every 30 seconds.
//
// Production (Hetzner) runs 6 services behind nginx on one domain:
//   main CRM (3210) + 5 sub-projects (3211-3215) proxied at /leadg/,
//   /foreclosure/, /contentplanner/, /media-workflow/, /legacyleads/.
// The URLs below are relative so they resolve correctly both on the Hetzner
// domain (same-origin nginx proxy) and locally (where NEXT_PUBLIC_*_URL can
// override to explicit localhost ports). API-only services (ContentPlanner
// API 3031, LegacyLeads API 3006, Live Audio WS 8090) are not exposed as
// separate public origins in prod, so they are not listed here.

import { useEffect, useState } from 'react';

interface ServiceStatus {
  name: string;
  port: number;
  url: string;
  status: 'checking' | 'up' | 'down';
}

const SERVICES: Omit<ServiceStatus, 'status'>[] = [
  { name: 'Main CRM', port: 3210, url: '/api/auth/session' },
  { name: 'LeadG', port: 3211, url: process.env.NEXT_PUBLIC_LEADG_URL || '/leadg/' },
  { name: 'Foreclosure', port: 3212, url: process.env.NEXT_PUBLIC_FORECLOSURE_URL || '/foreclosure/' },
  { name: 'ContentPlanner', port: 3213, url: process.env.NEXT_PUBLIC_CONTENT_PLANNER_URL || '/contentplanner/' },
  { name: 'MediaWorkflow', port: 3214, url: process.env.NEXT_PUBLIC_MEDIA_WORKFLOW_URL || '/media-workflow/' },
  { name: 'LegacyLeads', port: 3215, url: process.env.NEXT_PUBLIC_LEGACY_LEADS_URL || '/legacyleads/' },
];

export default function ServiceHealthGrid() {
  const [services, setServices] = useState<ServiceStatus[]>(
    SERVICES.map((s) => ({ ...s, status: 'checking' as const }))
  );

  useEffect(() => {
    let cancelled = false;

    async function checkAll() {
      const results = await Promise.all(
        SERVICES.map(async (svc) => {
          try {
            // Same-origin fetch: any response (200, 30x, 401) means the service
            // process is alive behind nginx. Only a network error means down.
            const res = await fetch(svc.url, { signal: AbortSignal.timeout(6000) });
            return { ...svc, status: 'up' as const };
          } catch {
            return { ...svc, status: 'down' as const };
          }
        })
      );
      if (!cancelled) setServices(results);
    }

    checkAll();
    const interval = setInterval(checkAll, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const upCount = services.filter((s) => s.status === 'up').length;

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Service Health</h3>
        <span
          className={
            'text-xs px-2 py-1 rounded-full ' +
            (upCount === services.length
              ? 'bg-green-100 text-green-700'
              : upCount > 0
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700')
          }
        >
          {upCount}/{services.length} online
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {services.map((svc) => (
          <a
            key={svc.port}
            href={svc.url.startsWith('/') ? svc.url : '#'}
            target={svc.url.startsWith('/') ? undefined : '_blank'}
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-2 py-1.5 rounded text-xs border hover:bg-muted transition-colors"
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
          </a>
        ))}
      </div>
    </div>
  );
}

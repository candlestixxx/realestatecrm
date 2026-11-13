'use client';

/**
 * ServiceHealthGrid — real-time status of all 12 platform runtime services.
 *
 * Why: previously this component only listed 6 services and called client-side
 * `fetch('/leadg/')`, which resolved Next.js 404 pages without throwing on
 * localhost — falsely marking stopped submodules as online. It now queries
 * `/api/system/health` (server-side loopback TCP probe across local ports
 * 3000-3009, 3031, 8090 and Hetzner prod ports 3210-3218) and resolves click
 * targets to `http://localhost:<localPort>` during local development or to
 * same-origin nginx proxy paths (`/leadg/`, etc.) in production.
 */

import { useEffect, useState, useCallback } from 'react';

interface ServiceHealthItem {
  id: string;
  name: string;
  localPort: number;
  port: number;
  proxyPath: string | null;
  kind: 'web' | 'api' | 'ws';
  role: string;
  status: 'checking' | 'up' | 'down';
}

const INITIAL_SERVICES: ServiceHealthItem[] = [
  { id: 'main-crm', name: 'Main CRM', localPort: 3000, port: 3000, proxyPath: '/dashboard', kind: 'web', role: 'Primary CRM dashboard & API', status: 'checking' },
  { id: 'live-audio', name: 'Live Audio WS', localPort: 8090, port: 8090, proxyPath: null, kind: 'ws', role: 'Real-time voice WebSocket monitor', status: 'checking' },
  { id: 'leadg', name: 'LeadG', localPort: 3001, port: 3001, proxyPath: '/leadg/', kind: 'web', role: 'VoiceForge outbound calling & lead engine', status: 'checking' },
  { id: 'foreclosure', name: 'Foreclosure', localPort: 3002, port: 3002, proxyPath: '/foreclosure/', kind: 'web', role: 'County legal notice intake & tax prefill', status: 'checking' },
  { id: 'contentplanner-web', name: 'ContentPlanner', localPort: 3003, port: 3003, proxyPath: '/contentplanner/', kind: 'web', role: 'Social content studio & brand kits UI', status: 'checking' },
  { id: 'contentplanner-api', name: 'ContentPlanner API', localPort: 3031, port: 3031, proxyPath: null, kind: 'api', role: 'Analytics, video & podcast pipeline API', status: 'checking' },
  { id: 'media-workflow', name: 'MediaWorkflow', localPort: 3004, port: 3004, proxyPath: '/media-workflow/', kind: 'web', role: 'Photo storyboard & FFmpeg promo video pipeline', status: 'checking' },
  { id: 'legacyleads-web', name: 'LegacyLeads', localPort: 3005, port: 3005, proxyPath: '/legacyleads/', kind: 'web', role: 'Property search, skip trace & TCPA UI', status: 'checking' },
  { id: 'legacyleads-api', name: 'LegacyLeads API', localPort: 3006, port: 3006, proxyPath: null, kind: 'api', role: 'Skip-trace enrichment & credit backend', status: 'checking' },
  { id: 'aicrm', name: 'AI CRM', localPort: 3007, port: 3007, proxyPath: '/aicrm/', kind: 'web', role: 'AI-first CRM & HyperNexus console', status: 'checking' },
  { id: 'leadcaller', name: 'Lead Caller', localPort: 3008, port: 3008, proxyPath: '/leadcaller/', kind: 'web', role: 'AI concierge & Twilio/Vapi calling workflows', status: 'checking' },
  { id: 'prototype-api', name: 'Prototype API', localPort: 3009, port: 3009, proxyPath: '/prototype/', kind: 'api', role: 'Universal business-tool sandbox server', status: 'checking' },
];

export default function ServiceHealthGrid() {
  const [services, setServices] = useState<ServiceHealthItem[]>(INITIAL_SERVICES);
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hostname;
      setIsLocalhost(h === 'localhost' || h === '127.0.0.1');
    }
  }, []);

  const checkAll = useCallback(async () => {
    try {
      const res = await fetch('/api/system/health', { cache: 'no-store' });
      if (!res.ok) throw new Error('health endpoint failed');
      const data = await res.json();
      if (Array.isArray(data.services)) {
        setServices(data.services);
      }
    } catch {
      setServices((prev) =>
        prev.map((s) => ({ ...s, status: s.id === 'main-crm' ? 'down' : s.status })),
      );
    }
  }, []);

  useEffect(() => {
    checkAll();
    const interval = setInterval(checkAll, 15000);
    return () => clearInterval(interval);
  }, [checkAll]);

  const upCount = services.filter((s) => s.status === 'up').length;

  const resolveHref = (svc: ServiceHealthItem): string | null => {
    if (svc.kind === 'ws') return null;
    if (isLocalhost) {
      if (svc.kind === 'api') return null;
      return `http://localhost:${svc.localPort}`;
    }
    return svc.proxyPath;
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-foreground">12-Service Platform Health</h3>
          <span
            title="Live server-side TCP health check across Main CRM, Live Audio WS, and all 8 submodule services. Polls every 15s; locally you can also control services from the Windows System Tray."
            aria-label="About Service Health"
            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[9px] font-bold text-muted-foreground cursor-help"
          >
            i
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={checkAll}
            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground px-2 py-0.5 rounded border border-border/60 hover:bg-muted transition-colors"
            title="Re-check all 12 service ports immediately"
          >
            Recheck
          </button>
          <span
            className={
              'text-xs font-semibold px-2.5 py-0.5 rounded-full ' +
              (upCount === services.length
                ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                : upCount > 0
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                : 'bg-red-500/15 text-red-600 dark:text-red-400')
            }
          >
            {upCount}/{services.length} online
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {services.map((svc) => {
          const href = resolveHref(svc);
          const badgeLabel = svc.kind === 'ws' ? 'WS' : svc.kind === 'api' ? 'API' : `:${svc.port}`;
          const titleText = `${svc.name} (port ${svc.port}) — ${svc.role} [${svc.status.toUpperCase()}]`;
          const inner = (
            <>
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
              <span className="text-foreground font-medium truncate flex-1">{svc.name}</span>
              <span className="text-[10px] font-mono text-muted-foreground flex-shrink-0">
                {badgeLabel}
              </span>
            </>
          );

          if (href) {
            return (
              <a
                key={svc.id}
                href={href}
                target={href.startsWith('http') || href !== '/dashboard' ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs border border-border/70 bg-background hover:border-primary/40 hover:bg-muted/50 transition-colors"
                title={titleText}
              >
                {inner}
              </a>
            );
          }

          return (
            <div
              key={svc.id}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs border border-border/60 bg-muted/20"
              title={titleText}
            >
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}

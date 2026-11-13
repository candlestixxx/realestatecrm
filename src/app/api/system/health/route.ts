import { NextResponse } from 'next/server';
import net from 'net';

/**
 * Unified 12-service platform health endpoint.
 *
 * Why: client-side `fetch('/leadg/')` resolved HTTP 404 responses on localhost
 * without throwing, falsely reporting stopped submodules as online, and could
 * not probe WebSocket or API-only services (ports 8090, 3031, 3006, 3009).
 * Probing loopback TCP listeners server-side checks all 12 runtime processes
 * in parallel (<600ms wall-clock) and supports both local dev ports (3000-3009,
 * 3031, 8090) and Hetzner production ports (3210-3218).
 */

export const dynamic = 'force-dynamic';

interface ServiceDef {
  id: string;
  name: string;
  localPort: number;
  prodPort?: number;
  proxyPath: string | null;
  kind: 'web' | 'api' | 'ws';
  role: string;
}

const PLATFORM_SERVICES: ServiceDef[] = [
  {
    id: 'main-crm',
    name: 'Main CRM',
    localPort: 3000,
    prodPort: 3210,
    proxyPath: '/dashboard',
    kind: 'web',
    role: 'Primary CRM dashboard, unified RAG, Prisma API & auth server',
  },
  {
    id: 'live-audio',
    name: 'Live Audio WS',
    localPort: 8090,
    prodPort: 8090,
    proxyPath: null,
    kind: 'ws',
    role: 'Real-time WebSocket voice waveform & live call monitor',
  },
  {
    id: 'leadg',
    name: 'LeadG',
    localPort: 3001,
    prodPort: 3211,
    proxyPath: '/leadg/',
    kind: 'web',
    role: 'VoiceForge AI outbound calling, accent morphing & lead engine',
  },
  {
    id: 'foreclosure',
    name: 'Foreclosure',
    localPort: 3002,
    prodPort: 3212,
    proxyPath: '/foreclosure/',
    kind: 'web',
    role: 'Macomb/Bay County foreclosure notice parser & tax-assessor prefill',
  },
  {
    id: 'contentplanner-web',
    name: 'ContentPlanner',
    localPort: 3003,
    prodPort: 3213,
    proxyPath: '/contentplanner/',
    kind: 'web',
    role: 'Social content studio, brand kits & multi-channel scheduler UI',
  },
  {
    id: 'contentplanner-api',
    name: 'ContentPlanner API',
    localPort: 3031,
    prodPort: 3031,
    proxyPath: null,
    kind: 'api',
    role: 'Content analytics, video projects, podcasts & notification backend',
  },
  {
    id: 'media-workflow',
    name: 'MediaWorkflow',
    localPort: 3004,
    prodPort: 3214,
    proxyPath: '/media-workflow/',
    kind: 'web',
    role: 'Property photo storyboard, AI promo video & FFmpeg export studio',
  },
  {
    id: 'legacyleads-web',
    name: 'LegacyLeads',
    localPort: 3005,
    prodPort: 3215,
    proxyPath: '/legacyleads/',
    kind: 'web',
    role: 'Property search, skip tracing & TCPA/DNC compliance UI',
  },
  {
    id: 'legacyleads-api',
    name: 'LegacyLeads API',
    localPort: 3006,
    prodPort: 3006,
    proxyPath: null,
    kind: 'api',
    role: 'Skip-trace enrichment & credit management Express backend',
  },
  {
    id: 'aicrm',
    name: 'AI CRM',
    localPort: 3007,
    prodPort: 3216,
    proxyPath: '/aicrm/',
    kind: 'web',
    role: 'Standalone AI-first CRM with funnels & HyperNexus kernel chat',
  },
  {
    id: 'leadcaller',
    name: 'Lead Caller',
    localPort: 3008,
    prodPort: 3217,
    proxyPath: '/leadcaller/',
    kind: 'web',
    role: 'Autonomous real-estate concierge & Twilio/Vapi calling workflows',
  },
  {
    id: 'prototype-api',
    name: 'Prototype API',
    localPort: 3009,
    prodPort: 3218,
    proxyPath: '/prototype/',
    kind: 'api',
    role: 'Universal business-tool rapid feature sandbox server',
  },
];

function probeTcpPort(port: number, timeoutMs = 550): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(ok);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, '127.0.0.1');
  });
}

export async function GET() {
  const preferProd = process.env.PORT === '3210' || process.env.NODE_ENV === 'production';

  const services = await Promise.all(
    PLATFORM_SERVICES.map(async (svc) => {
      const candidatePorts =
        svc.prodPort && svc.prodPort !== svc.localPort
          ? preferProd
            ? [svc.prodPort, svc.localPort]
            : [svc.localPort, svc.prodPort]
          : [svc.localPort];

      let activePort: number | null = null;
      for (const p of candidatePorts) {
        if (await probeTcpPort(p)) {
          activePort = p;
          break;
        }
      }

      return {
        id: svc.id,
        name: svc.name,
        localPort: svc.localPort,
        port: activePort ?? candidatePorts[0],
        proxyPath: svc.proxyPath,
        kind: svc.kind,
        role: svc.role,
        status: activePort !== null ? ('up' as const) : ('down' as const),
      };
    }),
  );

  const upCount = services.filter((s) => s.status === 'up').length;

  return NextResponse.json({
    services,
    upCount,
    total: services.length,
    checkedAt: new Date().toISOString(),
  });
}

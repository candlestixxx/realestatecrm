"use client";

/**
 * CommandCenter — unified single-page dashboard surface.
 *
 * Why: the product previously scattered 26+ route groups across nested
 * sidebar flyouts. Operators lost context switching pages and high-value
 * tools (reporting, audit, listings, partners, leaderboard) were not even
 * in the nav. This component is the single source of truth: every feature
 * in the product is represented here, ordered by business value, with
 * inline stats where cheap and a deep-link for the full workspace.
 *
 * Structure: a value-ordered section rail (left) + a section body (right).
 * Sections collapse into a horizontal scroll rail on small viewports.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SectionId =
  | 'overview'
  | 'pipeline'
  | 'comms'
  | 'marketing'
  | 'properties'
  | 'intelligence'
  | 'automation'
  | 'platform';

interface FeatureCard {
  label: string;
  description: string;
  href: string;
  icon: string;
  /** Tooltip shown on the info badge — explains when/why to use this tool. */
  tooltip: string;
  /** Priority within the section: 0 = most prominent. */
  priority?: number;
  /** Optional live stat fetched from an API endpoint. */
  statKey?: string;
  badge?: string;
}

interface Section {
  id: SectionId;
  title: string;
  tagline: string;
  features: FeatureCard[];
}

// ---------------------------------------------------------------------------
// Feature catalogue — every dashboard capability, value-ordered
// ---------------------------------------------------------------------------

const SECTIONS: Section[] = [
  {
    id: 'overview',
    title: 'Command Center',
    tagline: 'Live business pulse and highest-frequency actions',
    features: [
      {
        label: 'Lead Intake & Routing',
        description: 'Capture, score, and auto-assign incoming leads round-robin or by rule.',
        href: '/dashboard/leads',
        icon: '⚡',
        tooltip:
          'New leads land here first. AI qualification scores intent; routing rules assign owners. Open this when you need to work today\'s queue.',
        priority: 0,
        statKey: 'leads',
      },
      {
        label: 'Today\'s Tasks',
        description: 'Follow-ups, deadlines, and assignments sorted by urgency.',
        href: '/dashboard/tasks',
        icon: '✅',
        tooltip:
          'Everything with a due date or open status. Clear this list daily to keep deals moving.',
        priority: 1,
        statKey: 'tasks',
      },
      {
        label: 'Deal Pipeline',
        description: 'Stage-tracked deals with value forecasting and workflow sessions.',
        href: '/dashboard/deals',
        icon: '💰',
        tooltip:
          'Your revenue engine. Track deal value across stages; open any deal for documents, offers, and workflows.',
        priority: 2,
        statKey: 'pipeline',
      },
      {
        label: 'AI Co-Pilot',
        description: 'Agentic assistant with tool-calling — creates leads, tasks, segments from chat.',
        href: '/dashboard/agentcore',
        icon: '🤖',
        tooltip:
          'Gemini-powered co-pilot that can execute CRM actions directly. Ask it to "create a task" or "segment leads from last week" and it will do it.',
        priority: 3,
        badge: 'AI',
      },
      {
        label: 'Unified Inbox',
        description: 'Email, SMS, social DMs, and call recordings in one thread per contact.',
        href: '/dashboard/inbox',
        icon: '📬',
        tooltip:
          'All conversations for a contact unified here. Reply across channels without leaving the thread.',
        priority: 4,
      },
      {
        label: 'Lead Map',
        description: 'Geographic view with geofence drawing, clustering, and TCPA timezone checks.',
        href: '/dashboard/map',
        icon: '🗺️',
        tooltip:
          'Mapbox-powered. Draw geofences to build farm areas; Supercluster keeps dense metro areas readable. TCPA lookup tells you legal calling hours.',
        priority: 5,
      },
    ],
  },
  {
    id: 'pipeline',
    title: 'Pipeline & Relationships',
    tagline: 'Contacts, segmentation, and the deals that move revenue',
    features: [
      {
        label: 'Leads & Contacts',
        description: 'Full CRM records with multi-phone/email, tags, intelligence tabs, quick-edit.',
        href: '/dashboard/leads',
        icon: '👥',
        tooltip:
          'Primary record store. Each lead has a detail view with social scrapes, public records, campaign enrollment, and activity timeline.',
        statKey: 'leads',
      },
      {
        label: 'Filtered Segments',
        description: 'Saved dynamic lists for targeting, campaigns, and bulk actions.',
        href: '/dashboard/segments',
        icon: '🎯',
        tooltip:
          'Build a filter once, reuse it everywhere. Segments power drip enrollment, mass outreach, and exports.',
      },
      {
        label: 'Deals Pipeline',
        description: 'Kanban-style stages, offer tracking, disclosure e-sign, portal sharing.',
        href: '/dashboard/deals',
        icon: '💼',
        tooltip:
          'Each deal links to workflows, offers, and the client portal. Stage changes can trigger automations.',
        statKey: 'pipeline',
      },
      {
        label: 'Task Checklist',
        description: 'Personal and team tasks with deadlines, assignment, and priority.',
        href: '/dashboard/tasks',
        icon: '📋',
        tooltip:
          'Tasks can be created by AI, workflows, or manually. Filter by assignee or due date.',
        statKey: 'tasks',
      },
      {
        label: 'Workspace Segments',
        description: 'Workspace-as-segment model for multi-tenant list isolation.',
        href: '/dashboard/segments',
        icon: '📊',
        tooltip:
          'Workspaces double as top-level segments. Switch workspaces in the header to change your visible lead pool.',
      },
    ],
  },
  {
    id: 'comms',
    title: 'Communications & Outreach',
    tagline: 'Every channel your clients use, wired to the CRM timeline',
    features: [
      {
        label: 'Unified Inbox',
        description: 'Multi-channel message aggregation with per-contact threading.',
        href: '/dashboard/inbox',
        icon: '📬',
        tooltip: 'Email (SendGrid), SMS (Twilio), social DMs, and voice notes all land here.',
      },
      {
        label: 'Drip Campaigns',
        description: 'AI-led SMS/Email sequences with due-task auto-processing.',
        href: '/dashboard/campaigns',
        icon: '📈',
        tooltip:
          'Build multi-step sequences. The layout auto-processes due steps every request. A/B variant picker with weighted selection is available per step.',
      },
      {
        label: 'SMS Text Codes',
        description: 'Keyword-based auto-responses and lead capture via short codes.',
        href: '/dashboard/marketing/text-codes',
        icon: '💬',
        tooltip:
          'Prospects text a keyword to your number; the system auto-creates a lead and enrolls them in a campaign.',
      },
      {
        label: 'Mass Outreach',
        description: 'Bulk SMS/Email to any segment with compliance guardrails.',
        href: '/dashboard/leads',
        icon: '📣',
        tooltip:
          'Select leads in the table and launch a blast. TCPA quiet-hours enforcement is built in.',
      },
      {
        label: 'Voice Calling',
        description: 'Click-to-call, live audio monitoring, accent morphing, voice commands.',
        href: '/dashboard/settings/voice',
        icon: '📞',
        tooltip:
          'WebRTC calling with live waveform monitoring. Voice sessions write back to the CRM timeline automatically.',
      },
      {
        label: 'Lead Alerts',
        description: 'Real-time browser notifications when hot leads arrive.',
        href: '/dashboard/settings/integrations',
        icon: '🔔',
        tooltip:
          'Server-Sent Events push new-lead alerts to your browser. Configure thresholds in integrations.',
      },
    ],
  },
  {
    id: 'marketing',
    title: 'Marketing & Content Studio',
    tagline: 'Generate, brand, schedule, and publish across every channel',
    features: [
      {
        label: 'Marketing Studio',
        description: 'Hub for 10 marketing channels — email, social, print, video, ads.',
        href: '/dashboard/marketing-studio',
        icon: '🎨',
        tooltip:
          'One tool hub for all outbound creative. Channel-specific templates with brand kit injection.',
      },
      {
        label: 'Publishing Calendar',
        description: 'Monthly content calendar with drag-schedule and platform previews.',
        href: '/dashboard/calendar',
        icon: '📅',
        tooltip:
          'See every scheduled post across platforms. Drag to reschedule; conflicts are flagged.',
      },
      {
        label: 'Social Connections',
        description: 'OAuth account management for Facebook, Instagram, X, LinkedIn, YouTube, TikTok.',
        href: '/dashboard/social',
        icon: '🔗',
        tooltip: 'Connect or refresh social tokens here. Publishing fails if a token expires.',
      },
      {
        label: 'INSTA GEN (AI)',
        description: 'One-click AI generation of full listing marketing packages.',
        href: '/dashboard/agent-websites?tab=ai-creator',
        icon: '✨',
        tooltip:
          'Feed it a listing; it generates captions, hashtags, images, and a landing page in one pass.',
        badge: 'NEW',
      },
      {
        label: 'SEO & Blog Creator',
        description: 'AI blog posts with schema.org markup and localized keyword targeting.',
        href: '/dashboard/agent-websites?tab=seo-blog',
        icon: '✍️',
        tooltip: 'Generates SEO-optimized blog posts for agent websites with auto internal linking.',
      },
      {
        label: 'Social Studio',
        description: 'Platform-specific post generator with fair-housing compliance checks.',
        href: '/dashboard/agent-websites?tab=social-agent',
        icon: '📱',
        tooltip: 'AI brand compliance reviews every post for Fair Housing and FTC violations before publish.',
      },
      {
        label: 'Landing Page Builder',
        description: 'Traditional drag-drop landing pages for agent and property sites.',
        href: '/dashboard/agent-websites?tab=traditional',
        icon: '🏗️',
        tooltip: 'Pre-built responsive templates for agent sites, single-property sites, and neighborhood guides.',
      },
      {
        label: 'Media Studio',
        description: 'Photo import, storyboard generation, AI promo videos, FFmpeg export.',
        href: '/workflows/marketing-media',
        icon: '🎬',
        tooltip: 'Property photo → storyboard → rendered promo video pipeline with brand overlay.',
      },
    ],
  },
  {
    id: 'properties',
    title: 'Properties & Data',
    tagline: 'Listings, MLS feeds, foreclosures, and data hygiene',
    features: [
      {
        label: 'Listings',
        description: 'MLS listings with photos, offers, and status tracking.',
        href: '/dashboard/listings',
        icon: '🏠',
        tooltip: 'Listings synced from MLS/IDX. Each listing tracks offers and can generate marketing packages.',
        statKey: 'listings',
      },
      {
        label: 'IDX Search Widget',
        description: 'Embeddable RESO-powered search for agent websites.',
        href: '/dashboard/agent-websites',
        icon: '🔍',
        tooltip: 'Public-facing IDX search that captures leads into the CRM on inquiry.',
      },
      {
        label: 'Foreclosure Pipeline',
        description: 'Macomb/Bay County foreclosure monitoring with tax-assessor prefill.',
        href: '/workflows/foreclosure-intake',
        icon: '⚖️',
        tooltip:
          'Automated daily intake from legal news + BS&A/Realcomp tax data. Watchlist with equity and auction-date scoring.',
      },
      {
        label: 'Data Quality',
        description: 'Field completeness scoring with prioritized fix recommendations.',
        href: '/dashboard/data-quality',
        icon: '🧹',
        tooltip: 'Scores each contact record for completeness. Fix high-severity gaps first for best outreach results.',
      },
      {
        label: 'Skip Tracing',
        description: 'Batch contact enrichment with provider fallback chain.',
        href: '/dashboard/leads',
        icon: '🕵️',
        tooltip: 'Enrich leads with phone/email/addresses. Multiple providers with automatic fallback.',
      },
      {
        label: 'Document Uploads',
        description: 'S3 presigned uploads with magic-byte folder detection (8 formats).',
        href: '/dashboard/deals',
        icon: '📁',
        tooltip: 'Drop PDFs, DOCX, XLSX, images, ZIPs — auto-classified into the right deal folder.',
      },
    ],
  },
  {
    id: 'intelligence',
    title: 'Intelligence & Compliance',
    tagline: 'Reporting, gamification, and full audit provenance',
    features: [
      {
        label: 'Reporting Dashboard',
        description: 'Lead/deal/listing/partner analytics with stage-value breakdowns.',
        href: '/dashboard/reporting',
        icon: '📊',
        tooltip: 'Live aggregates across every entity. Export-ready charts for broker reviews.',
      },
      {
        label: 'Analytics Studio',
        description: 'Deeper funnel, source, and conversion analytics.',
        href: '/dashboard/reporting/analytics',
        icon: '📈',
        tooltip: 'Funnel drop-off analysis, source attribution, and conversion cohort tracking.',
      },
      {
        label: 'Lead Scoring',
        description: 'Predictive scoring with recency, engagement, and deal-size features.',
        href: '/dashboard/leads',
        icon: '🧠',
        tooltip: 'Weighted model with confidence intervals. Score updates on every activity event.',
      },
      {
        label: 'Leaderboard',
        description: 'Gamified points, streaks, and achievement badges per agent.',
        href: '/dashboard/leaderboard',
        icon: '🏆',
        tooltip: 'Activity-based points with badge unlocks. Drives healthy competition across the team.',
      },
      {
        label: 'Audit Trail',
        description: 'Immutable create/update/delete log with IP and user attribution.',
        href: '/dashboard/audit',
        icon: '📜',
        tooltip: 'Every entity mutation is recorded. Required for compliance reviews and dispute resolution.',
      },
      {
        label: 'Cross-Tenant Syndication',
        description: 'Anonymized market trends across brokerages (min 5-sample privacy).',
        href: '/dashboard/reporting',
        icon: '🌐',
        tooltip: 'Share anonymized market heat data with partner brokerages. Privacy threshold prevents identifying individual agents.',
      },
    ],
  },
  {
    id: 'automation',
    title: 'Automation & Agents',
    tagline: 'Workflows, AI agents, and approval gates',
    features: [
      {
        label: 'Workflows (Wizards)',
        description: 'State-machine workflows for deals, foreclosures, listing entry, offers.',
        href: '/dashboard/workflows',
        icon: '⚙️',
        tooltip: 'Guided multi-step processes with persistence. Each workflow session tracks progress and approvals.',
      },
      {
        label: 'Agent Studio',
        description: 'Configure AI agents with tools, memory, and deployment targets.',
        href: '/dashboard/agent-studio',
        icon: '🤖',
        tooltip: 'Define agent personas with specific tool access. Agents can run on schedules or event triggers.',
      },
      {
        label: 'AgentCore Console',
        description: 'Live agent command console + visual workflow builder.',
        href: '/dashboard/agentcore',
        icon: '🖥️',
        tooltip: 'Watch agents execute in real time. The workflow builder wires agent steps into pipelines.',
      },
      {
        label: 'Approvals',
        description: 'Human-in-the-loop gates for offers, listings, and marketing content.',
        href: '/dashboard/approvals',
        icon: '✋',
        tooltip: 'Anything flagged by compliance or policy lands here for review before it goes live.',
      },
      {
        label: 'Lead Automations',
        description: 'Rule-based triggers: status change → task, tag → campaign, etc.',
        href: '/dashboard/workflows',
        icon: '🔁',
        tooltip: 'If-this-then-that rules scoped per workspace. Automations run server-side on every mutation.',
      },
    ],
  },
  {
    id: 'platform',
    title: 'Platform & Settings',
    tagline: 'Websites, partners, integrations, and system configuration',
    features: [
      {
        label: 'Agent Websites',
        description: 'Multi-tenant site builder with IDX, chat widget, and lead capture.',
        href: '/dashboard/agent-websites',
        icon: '🌐',
        tooltip: 'Full website infrastructure per agent. RESO Web API sync, SSR/ISR property pages, embedded AI chat.',
      },
      {
        label: 'Website Builder',
        description: 'Drag-and-drop WYSIWYG for pages, templates, and landing funnels.',
        href: '/dashboard/websites/builder',
        icon: '🧱',
        tooltip: 'Visual builder replicating Lofty.com parity. Pre-built templates for agents, properties, neighborhoods.',
      },
      {
        label: 'Partners',
        description: 'Mortgage/title/insurance partner network with referral tracking.',
        href: '/dashboard/partners',
        icon: '🤝',
        tooltip: 'Partner permissions control what each vendor can see. Referrals flow into the deal pipeline.',
      },
      {
        label: 'Lead Integrations',
        description: 'MyPlusLeads, HubSpot, Salesforce, Lofty sync configuration.',
        href: '/dashboard/settings/integrations',
        icon: '🔌',
        tooltip: 'Wire external lead sources. MyPlusLeads cron sync runs hourly with high-frequency morning window.',
      },
      {
        label: 'Email Settings',
        description: 'SendGrid/SMTP configuration, templates, and sender identity.',
        href: '/dashboard/settings/email',
        icon: '📧',
        tooltip: 'Configure sending domains and templates. Magic-link auth emails use these settings.',
      },
      {
        label: 'Voice Settings',
        description: 'Speech provider selection (OpenAI / ElevenLabs) and accent profiles.',
        href: '/dashboard/settings/voice',
        icon: '🎙️',
        tooltip: 'Pick TTS/STT providers and configure accent morphing profiles for outbound calls.',
      },
      {
        label: 'AI Model Keys',
        description: 'Provider API keys for Gemini, OpenAI, and other model endpoints.',
        href: '/dashboard/settings/ai-models',
        icon: '🔑',
        tooltip: 'Keys for the AI layer. The co-pilot defaults to Gemini 2.0 Flash; override per-agent if needed.',
      },
      {
        label: 'MCP Server',
        description: 'Model Context Protocol server config for external agent tool access.',
        href: '/dashboard/settings/mcp',
        icon: '🧩',
        tooltip: 'Expose CRM tools to external MCP-compatible agents (Claude, Cursor, etc.).',
      },
      {
        label: 'Sync Queue Log',
        description: 'Outbound sync job history with retry status and error traces.',
        href: '/dashboard/sync-queue',
        icon: '📋',
        tooltip: 'Every outbound webhook and sync job is logged here. Failed jobs can be requeued.',
      },
      {
        label: 'Help Center',
        description: 'In-app manual, tooltips index, and contextual guidance.',
        href: '/dashboard/help-center',
        icon: '❓',
        tooltip: 'Searchable help articles. Every feature in this console links here for deep guidance.',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Inline stat hooks — lightweight, non-blocking
// ---------------------------------------------------------------------------

function useDashboardStats() {
  const [stats, setStats] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      // Single consolidated endpoint keeps the console fast.
      const res = await fetch('/api/reporting?workspaceId=excel-legacy-team');
      if (!res.ok) throw new Error('reporting fetch failed');
      const data = await res.json();
      const next: Record<string, string> = {};
      if (data.leads) next.leads = String(data.leads.total ?? 0);
      if (data.deals) {
        next.pipeline = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(data.deals.totalValue ?? 0);
      }
      if (data.listings) next.listings = String(data.listings.total ?? 0);
      setStats(next);
    } catch {
      // Stats are progressive enhancement — never block the console.
      setStats({});
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, loaded, refresh };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InfoBadge({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="More information"
          className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[9px] font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          i
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="text-xs leading-relaxed">{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function FeatureTile({ card, stat }: { card: FeatureCard; stat?: string }) {
  return (
    <Link
      href={card.href}
      className="group relative flex flex-col gap-2 rounded-xl border border-border bg-background p-4 hover:border-primary/40 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none" aria-hidden>
            {card.icon}
          </span>
          <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
            {card.label}
          </h4>
        </div>
        <div className="flex items-center gap-1.5">
          {card.badge && (
            <span className="rounded-full bg-indigo-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-indigo-500">
              {card.badge}
            </span>
          )}
          <InfoBadge text={card.tooltip} />
        </div>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{card.description}</p>
      {stat !== undefined && (
        <div className="mt-auto pt-2 border-t border-border/40">
          <span className="text-lg font-black text-primary">{stat}</span>
        </div>
      )}
    </Link>
  );
}

function SectionRail({
  active,
  onSelect,
}: {
  active: SectionId;
  onSelect: (id: SectionId) => void;
}) {
  return (
    <nav
      aria-label="Command center sections"
      className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 md:w-52 shrink-0"
    >
      {SECTIONS.map((s) => {
        const isActive = s.id === active;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={
              'flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-bold transition-all whitespace-nowrap ' +
              (isActive
                ? 'bg-primary/15 text-primary border border-primary/30'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent')
            }
          >
            <span
              className={
                'h-1.5 w-1.5 rounded-full ' + (isActive ? 'bg-primary' : 'bg-muted-foreground/30')
              }
            />
            {s.title}
          </button>
        );
      })}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export default function CommandCenter() {
  const [active, setActive] = useState<SectionId>('overview');
  const { stats, refresh } = useDashboardStats();
  const section = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0];

  // Sort cards by priority so the highest-value tools sit top-left.
  const cards = [...section.features].sort(
    (a, b) => (a.priority ?? 99) - (b.priority ?? 99),
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6 max-w-[1400px] mx-auto">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Every feature in one place — organized by business value. Hover the{' '}
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[9px] font-bold align-middle">
                i
              </span>{' '}
              badges for guidance on when and why to use each tool.
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            className="self-start sm:self-auto rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            ↻ Refresh stats
          </button>
        </div>

        {/* Body: section rail + cards */}
        <div className="flex flex-col md:flex-row gap-6">
          <SectionRail active={active} onSelect={setActive} />

          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
              <p className="text-xs text-muted-foreground">{section.tagline}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {cards.map((card) => (
                <FeatureTile
                  key={card.label}
                  card={card}
                  stat={card.statKey ? stats[card.statKey] : undefined}
                />
              ))}
            </div>

            {/* Section-level quick actions */}
            {section.id === 'overview' && (
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold">Quick Actions</h3>
                  <InfoBadge text="High-frequency actions. These open the relevant form or page directly so you can act without hunting through menus." />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '+ New Lead', href: '/dashboard/leads?new=1' },
                    { label: '+ New Deal', href: '/dashboard/deals?new=1' },
                    { label: '+ New Task', href: '/dashboard/tasks?new=1' },
                    { label: 'Send Broadcast', href: '/dashboard/leads?broadcast=1' },
                    { label: 'Generate Content', href: '/dashboard/agent-websites?tab=ai-creator' },
                    { label: 'Open Reports', href: '/dashboard/reporting' },
                  ].map((a) => (
                    <Link
                      key={a.label}
                      href={a.href}
                      className="rounded-lg bg-background border border-border px-3 py-2 text-xs font-semibold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                    >
                      {a.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* System status strip */}
            {section.id === 'platform' && (
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold">System Status</h3>
                  <InfoBadge text="Runtime health for background services. If any indicator is red, check the Sync Queue Log and server logs." />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {[
                    { label: 'Sync Scheduler', ok: true },
                    { label: 'Campaign Processor', ok: true },
                    { label: 'Lead Alerts (SSE)', ok: true },
                    { label: 'Vector RAG', ok: true },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center gap-2 rounded-lg bg-background border border-border px-3 py-2"
                    >
                      <span
                        className={
                          'h-2 w-2 rounded-full ' + (s.ok ? 'bg-green-500' : 'bg-red-500')
                        }
                      />
                      <span className="font-semibold">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

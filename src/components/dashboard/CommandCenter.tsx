"use client";

/**
 * CommandCenter — unified single-page executive console for Excel Legacy Realty Group.
 *
 * Why: operators previously had to hunt across 30+ nested routes, fragmented
 * settings stubs, and unlinked public funnels (/trust-services). Every single
 * capability, public funnel, settings domain, and 8-submodule service is now
 * represented here in strict business-value order with:
 *   1. An Executive KPI Strip (live Leads, Open Tasks, Deal Value, Listings,
 *      Contacts, and Active Smart Plans from `/api/reporting`).
 *   2. Instant keyword filter across all features, descriptions, and tooltips.
 *   3. Toggleable **All-in-One Single-Page Console** (default: renders every
 *      value-ordered hub on one scrollable page) vs. **Focused Section View**.
 *   4. Localhost-aware Sub-Project links (`http://localhost:3001..3009` locally,
 *      nginx `/leadg/`..`/prototype/` paths in production) + 12-Service Health.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getClientWorkspaceSlug } from '@/lib/workspace-client';
import LiveAudioMonitor from '@/components/LiveAudioMonitor';
import ServiceHealthGrid from '@/components/ServiceHealthGrid';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SectionId =
  | 'overview'
  | 'comms'
  | 'marketing'
  | 'pipeline'
  | 'properties'
  | 'automation'
  | 'intelligence'
  | 'platform'
  | 'subprojects';

type HubId = 'money' | 'marketing' | 'operations' | 'system';

interface Hub {
  id: HubId;
  label: string;
  summary: string;
}

const HUBS: Hub[] = [
  { id: 'money', label: '1. Money Now', summary: 'Immediate revenue: leads, follow-ups, deals, co-pilot, and flagship funnels' },
  { id: 'marketing', label: '2. Outreach & Marketing', summary: 'Omnichannel communication, drip plans, AI studio, and public lead magnets' },
  { id: 'operations', label: '3. Operations & Intelligence', summary: 'Listings, calculators, guided wizards, AI agents, analytics, and compliance' },
  { id: 'system', label: '4. Platform & Sub-Services', summary: 'Unified settings, websites, client portal, and 12-service ecosystem' },
];

interface FeatureCard {
  label: string;
  description: string;
  href: string;
  /** Optional localhost port so sub-projects open cleanly without nginx in local dev. */
  localPort?: number;
  external?: boolean;
  icon: string;
  /** Tooltip shown on the info badge — explains when/why to use this tool. */
  tooltip: string;
  /** Priority within the section: 0 = most prominent. */
  priority?: number;
  /** Optional live stat fetched from `/api/reporting`. */
  statKey?: string;
  badge?: string;
}

interface Section {
  id: SectionId;
  hub: HubId;
  title: string;
  tagline: string;
  features: FeatureCard[];
}

// ---------------------------------------------------------------------------
// Feature catalogue — every capability in the platform, ordered by value
// ---------------------------------------------------------------------------

const SECTIONS: Section[] = [
  {
    id: 'overview',
    hub: 'money',
    title: 'Money Now',
    tagline: "Today's highest-ROI actions — work inbound leads, clear tasks, advance deals, and share flagship funnels",
    features: [
      {
        label: 'Lead Intake & Routing',
        description: 'Capture, AI-score, and auto-assign incoming leads round-robin or by source rule.',
        href: '/dashboard/leads',
        icon: '⚡',
        tooltip:
          'New leads land here first. AI qualification grades intent (A-F); routing rules assign owners automatically. Start every morning here.',
        priority: 0,
        statKey: 'leads',
      },
      {
        label: "Today's Tasks",
        description: 'Open follow-ups, call reminders, and closing deadlines sorted by urgency.',
        href: '/dashboard/tasks',
        icon: '✅',
        tooltip:
          'Shows open tasks (non-DONE) out of total workspace tasks. Clear overdue and due-today items daily to protect deal velocity.',
        priority: 1,
        statKey: 'tasks',
      },
      {
        label: 'Deal Pipeline',
        description: 'Stage-tracked transactions with dollar volume forecasting, offers, and e-sign packets.',
        href: '/dashboard/deals',
        icon: '💰',
        tooltip:
          'Your revenue engine. Displays cumulative active deal value; click any deal to launch Offer Draft, upload disclosures, or share to the Client Portal.',
        priority: 2,
        statKey: 'pipeline',
      },
      {
        label: 'TSF Master Bundle ($997 / $1,497)',
        description: 'Flagship Personal Property Trust kit, 8-module course, and Done-With-You trust assembly funnel.',
        href: '/trust-services',
        external: true,
        icon: '🏛️',
        tooltip:
          'High-ticket public conversion funnel at /trust-services ($0 Free Branded 3-Doc Kit, $997 Done-With-You Assembly, $1,497 Master Bundle). Every signup lands directly in Leads with Trust source tags.',
        priority: 3,
        badge: 'FLAGSHIP',
      },
      {
        label: 'Unified Inbox',
        description: 'Email, SMS, social DMs, and voice call logs threaded per contact.',
        href: '/dashboard/inbox',
        icon: '📬',
        tooltip:
          'Reply across SMS, email, and social channels from one unified conversation timeline without switching tabs.',
        priority: 4,
      },
      {
        label: 'AI Co-Pilot & Console',
        description: 'Tool-calling assistant that creates leads, tasks, segments, and workflows from chat or voice.',
        href: '/dashboard/agentcore',
        icon: '🤖',
        tooltip:
          'Ask the co-pilot in plain English to segment leads, schedule follow-ups, or build an automation flow — it executes real CRM actions.',
        priority: 5,
        badge: 'AI',
      },
      {
        label: 'Investment & Net-Sheet Calculators',
        description: 'Live buyer affordability, investor DSCR/cap-rate/CoC verdicts, and seller net sheets.',
        href: '/dashboard/calculators',
        icon: '🧮',
        tooltip:
          'Interactive client presentation tool: shows monthly PITI, cash-to-close, investor pass/fail verdict, and seller net proceeds side-by-side.',
        priority: 6,
      },
      {
        label: 'Lead Map & Geofencing',
        description: 'Clustered property/lead map with polygon farm drawing and TCPA calling-hour checks.',
        href: '/dashboard/map',
        icon: '🗺️',
        tooltip:
          'Draw custom neighborhood farm polygons, inspect clustered leads, and verify local timezone TCPA quiet hours before dialing.',
        priority: 7,
      },
    ],
  },
  {
    id: 'comms',
    hub: 'marketing',
    title: 'Communications & Outreach',
    tagline: 'Every outbound and inbound client channel wired directly to the CRM timeline',
    features: [
      {
        label: 'Smart Plans & Drip Campaigns',
        description: 'Automated multi-day SMS, email, and call-task sequences with A/B step variants.',
        href: '/dashboard/campaigns',
        icon: '📈',
        tooltip:
          'Enroll individual leads or entire segments into automated follow-up sequences that pause automatically on reply.',
        priority: 0,
        statKey: 'campaigns',
      },
      {
        label: 'SMS Sign Riders & Text Codes',
        description: 'Yard-sign keyword auto-responders (e.g. 8485SHERMAN) that capture mobile leads 24/7.',
        href: '/dashboard/marketing?tab=text-codes',
        icon: '💬',
        tooltip:
          'Opens the inline SMS Text Codes tab in the Marketing Hub. Prospects text your keyword and immediately receive listing photos + portal link.',
        priority: 1,
      },
      {
        label: 'Trust Funding 101 Funnel ($0 / $497)',
        description: 'Educational mini-course + $497 1-on-1 trust funding package that feeds inbound leads.',
        href: '/trust-course',
        external: true,
        icon: '🎓',
        tooltip:
          'Public educational lead magnet at /trust-course. Captures homeowner and investor prospects into the CRM with tier attribution.',
        priority: 2,
        badge: 'FUNNEL',
      },
      {
        label: 'Mass Segment Outreach',
        description: 'Compliant bulk SMS and email broadcasts to filtered lead segments.',
        href: '/dashboard/leads?broadcast=1',
        icon: '📣',
        tooltip:
          'Select filtered leads and send personalized broadcasts with built-in TCPA quiet-hours and opt-out enforcement.',
        priority: 3,
      },
      {
        label: 'Voice Calling & Accent Morphing',
        description: 'WebRTC calling, OpenAI/ElevenLabs TTS/STT, and regional accent matching.',
        href: '/dashboard/settings?tab=voice',
        icon: '📞',
        tooltip:
          'Configure VoiceForge providers and test area-code accent morphing inline in the Unified Settings Console.',
        priority: 4,
      },
      {
        label: 'Objection Handling Playbooks',
        description: 'Battle-tested scripts and AI rebuttals for price, rate, timing, and commission objections.',
        href: '/dashboard/objections',
        icon: '🛡️',
        tooltip:
          'Keep open during live calls to get instant scripts and tailored AI responses to common buyer and seller pushback.',
        priority: 5,
      },
      {
        label: 'Team Chat',
        description: 'Private direct messages and deal-specific group rooms for internal brokerage coordination.',
        href: '/dashboard/chat',
        icon: '💭',
        tooltip:
          'Workspace-scoped internal chat so agents, transaction coordinators, and brokers stay aligned per deal.',
        priority: 6,
      },
    ],
  },
  {
    id: 'marketing',
    hub: 'marketing',
    title: 'Marketing & Content Studio',
    tagline: 'Generate, brand, schedule, and publish listing & brand content across 10 channels',
    features: [
      {
        label: 'Unified Marketing & Funnels Hub',
        description: 'All-in-one tabbed hub combining 10-channel Studio, SMS Text Codes, and Public Funnels.',
        href: '/dashboard/marketing',
        icon: '🚀',
        tooltip:
          'Canonical marketing home (/dashboard/marketing) uniting ContentPlanner metrics, creative tools, SMS sign riders, and Trust funnels.',
        priority: 0,
      },
      {
        label: 'INSTA GEN AI Package Creator',
        description: 'One-click AI generation of property landing pages, captions, hashtags, and social kits.',
        href: '/dashboard/agent-websites?tab=ai-creator',
        icon: '✨',
        tooltip:
          'Prompt a listing address or valuation offer and publish a shareable /portal/site/<slug> page plus social copy in seconds.',
        priority: 1,
        badge: 'AI',
      },
      {
        label: 'Publishing Calendar',
        description: 'Monthly cross-platform schedule with conflict detection and post previews.',
        href: '/dashboard/calendar',
        icon: '📅',
        tooltip:
          'Visualize and reschedule upcoming Facebook, Instagram, LinkedIn, X, TikTok, and YouTube posts on one calendar.',
        priority: 2,
      },
      {
        label: 'Media Studio (Photo → Video)',
        description: 'Turn listing photos into storyboards, branded reels, and FFmpeg promo videos.',
        href: '/dashboard/workflows/marketing-media',
        icon: '🎬',
        tooltip:
          'Guided media workflow inside the dashboard shell that generates video assets with brokerage brand overlays.',
        priority: 3,
      },
      {
        label: 'AI Avatar Presenter Videos',
        description: 'Generate virtual spokesperson listing walkthroughs via HeyGen integration.',
        href: '/dashboard/avatar',
        icon: '🧑‍💼',
        tooltip:
          'Create presenter-led listing videos from property scripts (uses HEYGEN_API_KEY when configured).',
        priority: 4,
        badge: 'AI',
      },
      {
        label: 'SEO & Blog Creator',
        description: 'Localized hyper-local real-estate articles with schema.org structured data.',
        href: '/dashboard/agent-websites?tab=seo-blog',
        icon: '✍️',
        tooltip:
          'Drafts neighborhood guides and market-update blog posts optimized for organic search lead capture.',
        priority: 5,
      },
      {
        label: 'Social Studio & Fair-Housing Check',
        description: 'Platform-tailored social posts screened automatically for Fair Housing compliance.',
        href: '/dashboard/agent-websites?tab=social-agent',
        icon: '📱',
        tooltip:
          'Generates platform-native copy and flags Fair Housing / MLS compliance issues prior to publishing.',
        priority: 6,
      },
      {
        label: 'Canva Design Studio',
        description: 'Launch flyers, postcards, open-house sheets, and social graphics with Canva templates.',
        href: '/dashboard/canva',
        icon: '🎨',
        tooltip:
          'Connect Canva to pull listing photos and brand colors into print and digital templates.',
        priority: 7,
      },
      {
        label: 'Social Account Connections',
        description: 'Manage OAuth tokens for Facebook, Instagram, LinkedIn, X, YouTube, and TikTok.',
        href: '/dashboard/social',
        icon: '🔗',
        tooltip:
          'Connect social profiles and inspect per-platform engagement metrics.',
        priority: 8,
      },
    ],
  },
  {
    id: 'pipeline',
    hub: 'operations',
    title: 'Pipeline, Contacts & Contracts',
    tagline: 'Structured CRM records, dynamic segments, contracts, and secure document storage',
    features: [
      {
        label: 'Leads & Contacts Directory',
        description: 'Complete contact records with multi-phone validation, co-owners, tags, and timelines.',
        href: '/dashboard/leads',
        icon: '👥',
        tooltip:
          'Full CRM table with bulk actions, AI qualification, skip-tracing, Smart Plan enrollment, and quick inline editing.',
        priority: 0,
        statKey: 'contacts',
      },
      {
        label: 'Dynamic Segments',
        description: 'Saved filter audiences that power drip campaigns, broadcasts, and CSV exports.',
        href: '/dashboard/segments',
        icon: '🎯',
        tooltip:
          'Create reusable audience slices (e.g. Macomb County High-Equity Sellers, Trust Course Signups) updated dynamically.',
        priority: 1,
      },
      {
        label: 'Contracts & E-Signature',
        description: 'Purchase agreements, earnest-money receipts, leases, and tokenized `/sign/[token]` routing.',
        href: '/dashboard/contracts',
        icon: '📄',
        tooltip:
          'Draft and track transaction contracts and send tamper-evident e-signing links to buyers and sellers.',
        priority: 2,
      },
      {
        label: 'Document Vault',
        description: 'Encrypted transaction storage with magic-byte auto-classification across 8 file formats.',
        href: '/dashboard/vault',
        icon: '🔒',
        tooltip:
          'Centralized repository for signed disclosures, title commitments, inspection reports, and trust packets.',
        priority: 3,
      },
      {
        label: 'Referral Partners Network',
        description: 'Lenders, title companies, attorneys, and inspectors with granular deal permissions.',
        href: '/dashboard/partners',
        icon: '🤝',
        tooltip:
          'Track inbound/outbound partner referrals and control exactly which deal fields external partners can view.',
        priority: 4,
      },
    ],
  },
  {
    id: 'properties',
    hub: 'operations',
    title: 'Properties, MLS & Distressed Data',
    tagline: 'Active listings, RESO MLS enrichment, county foreclosures, bulk imports, and data hygiene',
    features: [
      {
        label: 'Listings Inventory',
        description: 'Active, pending, and sold listings with photo galleries, comps, and offer tracking.',
        href: '/dashboard/listings',
        icon: '🏠',
        tooltip:
          'Manage brokerage listings, review comparable sales, track incoming offers, and trigger 1-click marketing kits.',
        priority: 0,
        statKey: 'listings',
      },
      {
        label: 'Foreclosure Intake Pipeline',
        description: 'Macomb & Bay County legal-notice parser with BS&A tax-assessor equity prefill.',
        href: '/dashboard/workflows/foreclosure-intake',
        icon: '⚖️',
        tooltip:
          'Converts weekly county foreclosure notices into enriched, scored CRM leads with auction & redemption tracking.',
        priority: 1,
      },
      {
        label: 'Property Data & RESO Lookup',
        description: 'Tax records, ownership history, valuation estimates, and live MLS property search.',
        href: '/dashboard/property-data',
        icon: '🔎',
        tooltip:
          'Look up any parcel or address to inspect tax assessment, prior sales, and comparable properties.',
        priority: 2,
      },
      {
        label: 'Data Quality & Hygiene',
        description: 'Contact completeness scoring with prioritized missing-phone/email fix queues.',
        href: '/dashboard/data-quality',
        icon: '🧹',
        tooltip:
          'Identifies incomplete or duplicate records so skip-tracing and outreach hit rates stay high.',
        priority: 3,
      },
      {
        label: 'Bulk CSV / Excel Imports',
        description: 'Column-mapped batch import for leads, contacts, and property lists with deduplication.',
        href: '/dashboard/imports',
        icon: '📥',
        tooltip:
          'Upload spreadsheets from title reps, absentee-owner lists, or legacy CRMs with automatic field mapping.',
        priority: 4,
      },
    ],
  },
  {
    id: 'automation',
    hub: 'operations',
    title: 'Workflows, AI Agents & Approvals',
    tagline: 'Resumable transaction wizards, autonomous agent personas, and human compliance gates',
    features: [
      {
        label: 'Guided Workflows Hub',
        description: 'State-machine wizards for Foreclosure Intake, Offer Draft, Listing Entry, and Media.',
        href: '/dashboard/workflows',
        icon: '⚙️',
        tooltip:
          'Launch new guided workflows or resume saved draft sessions right where you left off.',
        priority: 0,
        statKey: 'workflows',
      },
      {
        label: 'MLS Listing Entry Wizard',
        description: 'Validated step-by-step property onboarding with photo ordering and AI remarks.',
        href: '/dashboard/workflows/listing-entry',
        icon: '🏡',
        tooltip:
          'Walks agents through complete MLS data capture and syncs directly to the Listings board.',
        priority: 1,
      },
      {
        label: 'Offer Draft Wizard',
        description: 'Guided purchase agreement builder with earnest money, contingencies, and e-sign.',
        href: '/dashboard/workflows/offer-draft',
        icon: '📝',
        tooltip:
          'Generates clean offer packets from Deal/Lead context and routes for broker review or client signature.',
        priority: 2,
      },
      {
        label: 'Agent Studio',
        description: 'Create specialized AI agents with custom prompts, MCP tools, memory, and triggers.',
        href: '/dashboard/agent-studio',
        icon: '🧠',
        tooltip:
          'Configure autonomous agent personas for lead qualification, listing copywriting, or research.',
        priority: 3,
        badge: 'AI',
      },
      {
        label: 'Human-in-the-Loop Approvals',
        description: 'Compliance review queue for AI-drafted offers, listings, and outbound campaigns.',
        href: '/dashboard/approvals',
        icon: '✋',
        tooltip:
          'Broker/manager gate ensuring sensitive documents and broadcasts are approved before execution.',
        priority: 4,
      },
    ],
  },
  {
    id: 'intelligence',
    hub: 'operations',
    title: 'Analytics, Gamification & Audit',
    tagline: 'Executive reporting, cross-brokerage benchmarks, team leaderboards, and immutable audit logs',
    features: [
      {
        label: 'Reporting & Market Trends',
        description: 'Funnel conversion, stage values, CSV exports, and anonymized cross-tenant benchmarks.',
        href: '/dashboard/reporting',
        icon: '📊',
        tooltip:
          'Consolidated Reporting + Analytics studio with pipeline breakdowns, partner ROI, and 1-click CSV export.',
        priority: 0,
      },
      {
        label: 'Team Leaderboard & Badges',
        description: 'Gamified agent points, daily streaks, and milestone badges across calls and closings.',
        href: '/dashboard/leaderboard',
        icon: '🏆',
        tooltip:
          'Tracks agent activity velocity and awards streaks and badges to keep team momentum high.',
        priority: 1,
      },
      {
        label: 'Immutable Audit Trail',
        description: 'Tamper-evident create/update/delete log with user, timestamp, and IP provenance.',
        href: '/dashboard/audit',
        icon: '📜',
        tooltip:
          'Full compliance history across every CRM mutation for brokerage oversight and dispute resolution.',
        priority: 2,
      },
      {
        label: 'Outbound Sync Queue',
        description: 'Webhook, RAG vector outbox, and external CRM sync job monitor with retry controls.',
        href: '/dashboard/sync-queue',
        icon: '🔄',
        tooltip:
          'Inspect pending or failed background sync jobs and requeue failed deliveries.',
        priority: 3,
      },
    ],
  },
  {
    id: 'platform',
    hub: 'system',
    title: 'Websites, Portals & Unified Settings',
    tagline: 'IDX websites, client transaction portal, inline settings console, and operator training',
    features: [
      {
        label: 'Unified Settings Console (All 10 Tabs)',
        description: 'Inline Integrations, AI Keys, Voice, Email, Branding, Team, Routing, Memory, MCP & Folders.',
        href: '/dashboard/settings',
        icon: '⚙️',
        tooltip:
          'Single-page settings console rendering every configuration form directly inline without page hops.',
        priority: 0,
      },
      {
        label: 'Agent IDX Websites',
        description: 'Multi-tenant agent sites with RESO IDX search, AI chat capture, and blog publishing.',
        href: '/dashboard/agent-websites',
        icon: '🌐',
        tooltip:
          'Manage agent microsites, IDX widgets, and AI-generated neighborhood landing pages.',
        priority: 1,
      },
      {
        label: 'WYSIWYG Website Canvas Builder',
        description: 'Drag-and-drop visual page builder and template library for custom funnels.',
        href: '/dashboard/websites',
        icon: '🧱',
        tooltip:
          'Customize multi-block pages and launch `/dashboard/websites/builder` for pixel-level layout editing.',
        priority: 2,
      },
      {
        label: 'Client Portal Management',
        description: 'Configure shared listings, milestone trackers, and documents visible to clients.',
        href: '/dashboard/client-portal',
        icon: '🔑',
        tooltip:
          'Admin view for curating what buyers and sellers see inside their branded transaction portal.',
        priority: 3,
      },
      {
        label: 'Live Client Portal Preview',
        description: 'Open the external white-label client portal (`/portal`) exactly as clients experience it.',
        href: '/portal',
        external: true,
        icon: '✨',
        tooltip:
          'Opens the live client-facing portal rendered with your workspace Branding colors and logo.',
        priority: 4,
      },
      {
        label: 'Lead & MLS Integrations',
        description: 'Jump straight to MyPlusLeads cron sync, RESO MLS credentials, and alert preferences.',
        href: '/dashboard/settings?tab=integrations',
        icon: '🔌',
        tooltip:
          'Opens the Lead & MLS Integrations tab inside the Unified Settings Console.',
        priority: 5,
      },
      {
        label: 'Team, Roles & Branding',
        description: 'Invite agents, set RBAC hierarchy roles, and customize white-label portal colors.',
        href: '/dashboard/settings?tab=team',
        icon: '👥',
        tooltip:
          'Opens Team & Roles in the Unified Settings Console (Branding is right beside it).',
        priority: 6,
      },
      {
        label: 'Help Center & Interactive Manuals',
        description: 'Step-by-step operator guides and live console simulations for every platform feature.',
        href: '/dashboard/help-center',
        icon: '📖',
        tooltip:
          'Interactive training portal covering Leads, Smart Plans, Trust Funnels, Calculators, Voice, and System Tray.',
        priority: 7,
      },
    ],
  },
  {
    id: 'subprojects',
    hub: 'system',
    title: '8 Integrated Sub-Projects',
    tagline: 'Independent specialized services under RealEstateCRMLLC powering voice, legal intake, media, and skip-tracing',
    features: [
      {
        label: 'LeadG — Voice & Lead Engine',
        description: 'VoiceForge AI outbound calling campaigns, accent morphing, and lead qualification.',
        href: '/leadg/',
        localPort: 3001,
        external: true,
        icon: '📞',
        tooltip:
          'Submodule apps/leadg (RealEstateCRMLLC/leadg). Local port 3001; production nginx /leadg/ (port 3211).',
        priority: 0,
        badge: ':3001',
      },
      {
        label: 'Foreclosure Workflow',
        description: 'Dedicated distressed-property monitor, county legal-notice parser, and auction tracker.',
        href: '/foreclosure/',
        localPort: 3002,
        external: true,
        icon: '⚖️',
        tooltip:
          'Submodule apps/foreclosureworkflow (RealEstateCRMLLC/foreclosureworkflow). Local port 3002; production /foreclosure/ (port 3212).',
        priority: 1,
        badge: ':3002',
      },
      {
        label: 'Content Planner',
        description: 'Turborepo social studio, brand-voice kits, video/podcast pipelines, and analytics.',
        href: '/contentplanner/',
        localPort: 3003,
        external: true,
        icon: '📝',
        tooltip:
          'Submodule apps/contentplanner (RealEstateCRMLLC/contentplanner). Web on local port 3003 (prod 3213) + API on port 3031.',
        priority: 2,
        badge: ':3003',
      },
      {
        label: 'Media Workflow',
        description: 'Property photo import, AI storyboard builder, and FFmpeg video rendering studio.',
        href: '/media-workflow/',
        localPort: 3004,
        external: true,
        icon: '🎬',
        tooltip:
          'Submodule apps/media-workflow (RealEstateCRMLLC/re-agent-workflow-media-1). Unified Express + Vite studio on local port 3004 (prod 3214).',
        priority: 3,
        badge: ':3004',
      },
      {
        label: 'LegacyLeads',
        description: 'Property lookup, batch skip-tracing, TCPA/DNC compliance, and credit ledger.',
        href: '/legacyleads/',
        localPort: 3005,
        external: true,
        icon: '🔍',
        tooltip:
          'Submodule apps/legacyleads (RealEstateCRMLLC/legacyleads). Vite frontend on local port 3005 (prod 3215) + Express API on port 3006.',
        priority: 4,
        badge: ':3005',
      },
      {
        label: 'AI CRM',
        description: 'Standalone AI-first CRM with funnels, pipelines, and HyperNexus kernel chat.',
        href: '/aicrm/',
        localPort: 3007,
        external: true,
        icon: '🤖',
        tooltip:
          'Submodule apps/aicrm (RealEstateCRMLLC/aicrm). Runs on local port 3007 (prod 3216) with tracked SQLite dev.db.',
        priority: 5,
        badge: ':3007',
      },
      {
        label: 'Lead Caller',
        description: 'Autonomous real-estate concierge and Twilio/Vapi/SendGrid outbound calling workflows.',
        href: '/leadcaller/',
        localPort: 3008,
        external: true,
        icon: '☎️',
        tooltip:
          'Submodule apps/leadcaller (RealEstateCRMLLC/realestateleadcaller). Runs on local port 3008 (prod 3217).',
        priority: 6,
        badge: ':3008',
      },
      {
        label: 'Prototype Sandbox',
        description: 'Universal business-tool rapid feature sandbox (Express API + client workspace).',
        href: '/prototype/',
        localPort: 3009,
        external: true,
        icon: '🧪',
        tooltip:
          'Submodule apps/prototype (RealEstateCRMLLC/realestateprototype). API runs on local port 3009.',
        priority: 7,
        badge: ':3009',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Live KPI & inline stat hook
// ---------------------------------------------------------------------------

interface KpiSnapshot {
  leads: string;
  tasks: string;
  openTasks: string;
  pipeline: string;
  dealsCount: string;
  listings: string;
  contacts: string;
  campaigns: string;
  workflows: string;
}

const EMPTY_KPIS: KpiSnapshot = {
  leads: '—',
  tasks: '—',
  openTasks: '—',
  pipeline: '—',
  dealsCount: '—',
  listings: '—',
  contacts: '—',
  campaigns: '—',
  workflows: '—',
};

function useDashboardStats() {
  const [stats, setStats] = useState<Record<string, string>>({});
  const [kpis, setKpis] = useState<KpiSnapshot>(EMPTY_KPIS);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/reporting?workspaceId=' + getClientWorkspaceSlug());
      if (!res.ok) throw new Error('reporting fetch failed');
      const data = await res.json();

      const leadsTotal = String(data.leads?.total ?? 0);
      const contactsTotal = String(data.contacts?.total ?? 0);
      const listingsTotal = String(data.listings?.total ?? 0);
      const dealsTotal = String(data.deals?.total ?? 0);
      const pipelineFormatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(data.deals?.totalValue ?? 0);
      const openTasks = String(data.tasks?.open ?? 0);
      const totalTasks = String(data.tasks?.total ?? 0);
      const activeCampaigns = String(data.campaigns?.active ?? 0);
      const activeWorkflows = String(data.workflows?.active ?? 0);

      setStats({
        leads: `${leadsTotal} leads`,
        tasks: `${openTasks} open`,
        pipeline: pipelineFormatted,
        listings: `${listingsTotal} active`,
        contacts: `${contactsTotal} contacts`,
        campaigns: `${activeCampaigns} active`,
        workflows: `${activeWorkflows} sessions`,
      });

      setKpis({
        leads: leadsTotal,
        tasks: `${openTasks} / ${totalTasks}`,
        openTasks,
        pipeline: pipelineFormatted,
        dealsCount: dealsTotal,
        listings: listingsTotal,
        contacts: contactsTotal,
        campaigns: activeCampaigns,
        workflows: activeWorkflows,
      });
    } catch {
      setStats({});
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, kpis, loaded, refresh };
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
          onClick={(e) => e.preventDefault()}
          className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[9px] font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
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

function FeatureTile({
  card,
  stat,
  isLocalhost,
}: {
  card: FeatureCard;
  stat?: string;
  isLocalhost: boolean;
}) {
  const resolvedHref =
    isLocalhost && card.localPort ? `http://localhost:${card.localPort}` : card.href;
  const openNewTab = card.external || Boolean(isLocalhost && card.localPort);

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl leading-none shrink-0" aria-hidden>
            {card.icon}
          </span>
          <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
            {card.label}
          </h4>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
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
        <div className="mt-auto pt-2 border-t border-border/40 flex items-center justify-between">
          <span className="text-sm font-black text-primary">{stat}</span>
          <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-primary">
            Open →
          </span>
        </div>
      )}
    </>
  );

  const tileClass =
    'group relative flex flex-col gap-2 rounded-xl border border-border bg-background p-4 hover:border-primary/40 hover:shadow-md transition-all';

  if (openNewTab) {
    return (
      <a href={resolvedHref} target="_blank" rel="noopener noreferrer" className={tileClass}>
        {content}
      </a>
    );
  }

  return (
    <Link href={resolvedHref} className={tileClass}>
      {content}
    </Link>
  );
}

function SectionRail({
  active,
  viewMode,
  onSelect,
}: {
  active: SectionId;
  viewMode: 'all' | 'focused';
  onSelect: (id: SectionId) => void;
}) {
  return (
    <nav
      aria-label="Command center sections"
      className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 md:w-56 shrink-0 md:sticky md:top-4 md:self-start"
    >
      {HUBS.map((hub) => {
        const items = SECTIONS.filter((s) => s.hub === hub.id);
        if (items.length === 0) return null;
        return (
          <div key={hub.id} className="space-y-1">
            <p className="hidden md:block px-3 pt-2.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">
              {hub.label}
            </p>
            {items.map((s) => {
              const isActive = s.id === active;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelect(s.id)}
                  className={
                    'w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold transition-all whitespace-nowrap cursor-pointer ' +
                    (isActive && viewMode === 'focused'
                      ? 'bg-primary/15 text-primary border border-primary/30'
                      : isActive
                      ? 'bg-muted text-foreground border border-border/60'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent')
                  }
                >
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className={
                        'h-1.5 w-1.5 rounded-full shrink-0 ' +
                        (isActive ? 'bg-primary' : 'bg-muted-foreground/30')
                      }
                    />
                    <span className="truncate">{s.title}</span>
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground/70">
                    {s.features.length}
                  </span>
                </button>
              );
            })}
          </div>
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
  const [viewMode, setViewMode] = useState<'all' | 'focused'>('all');
  const [query, setQuery] = useState('');
  const [isLocalhost, setIsLocalhost] = useState(false);
  const { stats, kpis, refresh } = useDashboardStats();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hostname;
      setIsLocalhost(h === 'localhost' || h === '127.0.0.1');
    }
  }, []);

  const totalFeatureCount = useMemo(
    () => SECTIONS.reduce((sum, s) => sum + s.features.length, 0),
    [],
  );

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SECTIONS.map((s) => {
      const sorted = [...s.features].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
      if (!q) return { ...s, features: sorted };
      return {
        ...s,
        features: sorted.filter(
          (f) =>
            f.label.toLowerCase().includes(q) ||
            f.description.toLowerCase().includes(q) ||
            f.tooltip.toLowerCase().includes(q) ||
            s.title.toLowerCase().includes(q),
        ),
      };
    }).filter((s) => s.features.length > 0);
  }, [query]);

  const handleRailSelect = (id: SectionId) => {
    setActive(id);
    if (viewMode === 'all' && typeof document !== 'undefined') {
      const el = document.getElementById(`cc-section-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const visibleSections =
    query.trim().length > 0 || viewMode === 'all'
      ? filteredSections
      : filteredSections.filter((s) => s.id === active);

  const kpiCards = [
    {
      label: 'Active Leads',
      value: kpis.leads,
      href: '/dashboard/leads',
      tooltip: 'Total leads in the current workspace. Click to work, score, and route your queue.',
    },
    {
      label: 'Open Tasks',
      value: kpis.openTasks,
      sub: `of ${kpis.tasks.split('/')[1]?.trim() || '0'} total`,
      href: '/dashboard/tasks',
      tooltip: 'Tasks not yet marked DONE. Clear open follow-ups daily to keep conversion velocity high.',
    },
    {
      label: 'Deal Pipeline',
      value: kpis.pipeline,
      sub: `${kpis.dealsCount} deals`,
      href: '/dashboard/deals',
      tooltip: 'Cumulative dollar value across all workspace deals. Click to manage stages and offers.',
    },
    {
      label: 'Active Listings',
      value: kpis.listings,
      href: '/dashboard/listings',
      tooltip: 'MLS and brokerage listings tracked in this workspace.',
    },
    {
      label: 'CRM Contacts',
      value: kpis.contacts,
      href: '/dashboard/leads',
      tooltip: 'Verified contact profiles including co-owners, buyers, sellers, and sphere.',
    },
    {
      label: 'Smart Plans',
      value: kpis.campaigns,
      href: '/dashboard/campaigns',
      tooltip: 'Active automated SMS/email drip plans ready for lead enrollment.',
    },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6 max-w-[1440px] mx-auto">
        {/* Page header + controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
              <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-[11px] font-bold">
                {totalFeatureCount} tools · 12 services
              </span>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Single-page executive console ordered by business value. Hover any{' '}
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[9px] font-bold align-middle">
                i
              </span>{' '}
              badge for guidance on when and why to use each workflow.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter all tools (e.g. trust, MLS, voice)..."
                aria-label="Filter Command Center tools"
                className="w-64 sm:w-72 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div
              className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5"
              role="group"
              aria-label="Console layout mode"
            >
              <button
                type="button"
                onClick={() => setViewMode('all')}
                title="Show every feature across all 9 sections on one unified scrollable page"
                className={
                  'rounded-md px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ' +
                  (viewMode === 'all'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground')
                }
              >
                All-in-One Page
              </button>
              <button
                type="button"
                onClick={() => setViewMode('focused')}
                title="Show only the currently selected section from the left rail"
                className={
                  'rounded-md px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ' +
                  (viewMode === 'focused'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground')
                }
              >
                Focused Section
              </button>
            </div>

            <button
              type="button"
              onClick={refresh}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Refresh live KPI counts from /api/reporting"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Executive KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {kpiCards.map((k) => (
            <Link
              key={k.label}
              href={k.href}
              className="rounded-xl border border-border bg-card p-3.5 hover:border-primary/40 hover:shadow-xs transition-all group"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
                  {k.label}
                </span>
                <InfoBadge text={k.tooltip} />
              </div>
              <div className="text-xl font-black text-foreground mt-1 truncate">{k.value}</div>
              {k.sub && <div className="text-[10px] text-muted-foreground mt-0.5">{k.sub}</div>}
            </Link>
          ))}
        </div>

        {/* High-frequency Quick Action Bar */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden>⚡</span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-foreground">
              Quick Launch
            </span>
            <InfoBadge text="One-click shortcuts to your highest-frequency revenue and marketing actions." />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '+ New Lead', href: '/dashboard/leads?new=1' },
              { label: '+ New Deal', href: '/dashboard/deals?new=1' },
              { label: '+ New Task', href: '/dashboard/tasks?new=1' },
              { label: '🏛️ TSF Trust Funnel', href: '/trust-services', external: true },
              { label: '🧮 Calculators', href: '/dashboard/calculators' },
              { label: '✨ AI Content Gen', href: '/dashboard/agent-websites?tab=ai-creator' },
              { label: '⚙️ Inline Settings', href: '/dashboard/settings' },
            ].map((a) =>
              a.external ? (
                <a
                  key={a.label}
                  href={a.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-background border border-border px-3 py-1.5 text-xs font-semibold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                >
                  {a.label}
                </a>
              ) : (
                <Link
                  key={a.label}
                  href={a.href}
                  className="rounded-lg bg-background border border-border px-3 py-1.5 text-xs font-semibold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                >
                  {a.label}
                </Link>
              ),
            )}
          </div>
        </div>

        {/* Main Body: Sticky Value Rail + Section Cards */}
        <div className="flex flex-col md:flex-row gap-6">
          <SectionRail active={active} viewMode={viewMode} onSelect={handleRailSelect} />

          <div className="flex-1 space-y-8 min-w-0">
            {visibleSections.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No tools matched <strong>&ldquo;{query}&rdquo;</strong>.{' '}
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-primary font-semibold hover:underline ml-1"
                >
                  Clear filter
                </button>
              </div>
            ) : (
              visibleSections.map((section) => (
                <section
                  key={section.id}
                  id={`cc-section-${section.id}`}
                  className="space-y-3 scroll-mt-6"
                >
                  <div className="border-b border-border/60 pb-2">
                    <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
                    <p className="text-xs text-muted-foreground">{section.tagline}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {section.features.map((card) => (
                      <FeatureTile
                        key={`${section.id}-${card.label}`}
                        card={card}
                        stat={card.statKey ? stats[card.statKey] : undefined}
                        isLocalhost={isLocalhost}
                      />
                    ))}
                  </div>

                  {section.id === 'subprojects' && (
                    <div className="pt-2">
                      <ServiceHealthGrid />
                    </div>
                  )}

                  {section.id === 'platform' && (
                    <div className="pt-2 space-y-3">
                      {viewMode === 'focused' && <ServiceHealthGrid />}
                      <LiveAudioMonitor />
                    </div>
                  )}
                </section>
              ))
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

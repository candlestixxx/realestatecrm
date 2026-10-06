"use client";

/**
 * SidebarNav — value-ordered primary navigation.
 *
 * Why: the previous sidebar used hover-only flyout menus that hid 6 pages
 * entirely (audit, data-quality, leaderboard, listings, partners, reporting)
 * and linked to a non-existent settings/routing route. This is a flat,
 * always-visible, value-ordered nav. Each group header carries an info
 * badge explaining the group's purpose so new operators can orient fast.
 *
 * The nav is a client component solely for tooltips; the layout stays RSC.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavLink {
  label: string;
  href: string;
  tooltip: string;
  badge?: string;
}

interface NavGroup {
  id: string;
  title: string;
  tooltip: string;
  links: NavLink[];
}

// Ordered by business value: the highest-frequency, highest-impact groups first.
const GROUPS: NavGroup[] = [
  {
    id: 'work',
    title: 'Today\'s Work',
    tooltip: 'The highest-frequency daily tools. Start every session here.',
    links: [
      {
        label: 'Command Center',
        href: '/dashboard',
        tooltip: 'Unified overview of every feature with live stats and quick actions.',
      },
      {
        label: 'Leads & Contacts',
        href: '/dashboard/leads',
        tooltip: 'Work the lead queue. Score, route, tag, and communicate from each record.',
      },
      {
        label: 'Tasks',
        href: '/dashboard/tasks',
        tooltip: 'Your open follow-ups and deadlines. Clear this daily.',
      },
      {
        label: 'Deals Pipeline',
        href: '/dashboard/deals',
        tooltip: 'Stage-tracked revenue. Open a deal for offers, docs, and workflows.',
      },
      {
        label: 'Unified Inbox',
        href: '/dashboard/inbox',
        tooltip: 'Email, SMS, social DMs, and voice notes in one thread per contact.',
      },
    ],
  },
  {
    id: 'outreach',
    title: 'Outreach & Marketing',
    tooltip: 'Everything that touches a prospect or publishes content.',
    links: [
      {
        label: 'Drip Campaigns',
        href: '/dashboard/campaigns',
        tooltip: 'AI-led SMS/Email sequences with weighted A/B variants.',
      },
      {
        label: 'Marketing Studio',
        href: '/dashboard/marketing-studio',
        tooltip: 'Hub for 10 marketing channels with brand-kit injection.',
      },
      {
        label: 'Publishing Calendar',
        href: '/dashboard/calendar',
        tooltip: 'Monthly content calendar across all social platforms.',
      },
      {
        label: 'Social Connections',
        href: '/dashboard/social',
        tooltip: 'OAuth account management for Facebook, Instagram, X, LinkedIn, YouTube, TikTok.',
      },
      {
        label: 'AI Content Gen',
        href: '/dashboard/agent-websites?tab=ai-creator',
        tooltip: 'One-click AI generation of listing marketing packages.',
        badge: 'AI',
      },
      {
        label: 'Media Studio',
        href: '/dashboard/workflows/marketing-media',
        tooltip: 'Photo → storyboard → AI promo video pipeline.',
      },
      {
        label: 'SMS Text Codes',
        href: '/dashboard/marketing/text-codes',
        tooltip: 'Keyword auto-responses that capture leads from inbound texts.',
      },
    ],
  },
  {
    id: 'properties',
    title: 'Properties & Data',
    tooltip: 'Listings, MLS, foreclosures, and data hygiene.',
    links: [
      {
        label: 'Listings',
        href: '/dashboard/listings',
        tooltip: 'MLS listings with photos, offers, and status tracking.',
      },
      {
        label: 'Lead Map',
        href: '/dashboard/map',
        tooltip: 'Mapbox geofences, Supercluster, and TCPA timezone lookup.',
      },
      {
        label: 'Foreclosures',
        href: '/dashboard/workflows/foreclosure-intake',
        tooltip: 'Macomb/Bay County foreclosure monitoring with tax-assessor prefill.',
      },
      {
        label: 'Data Quality',
        href: '/dashboard/data-quality',
        tooltip: 'Contact completeness scoring with prioritized fix recommendations.',
      },
    ],
  },
  {
    id: 'intelligence',
    title: 'Intelligence',
    tooltip: 'Analytics, scoring, gamification, and compliance.',
    links: [
      {
        label: 'Reporting & Analytics',
        href: '/dashboard/reporting',
        tooltip: 'Lead/deal/listing/partner analytics with bar charts and compact stats. Tabs for Overview and Quick Stats.',
      },
      {
        label: 'Leaderboard',
        href: '/dashboard/leaderboard',
        tooltip: 'Gamified points, streaks, and achievement badges.',
      },
      {
        label: 'Audit Trail',
        href: '/dashboard/audit',
        tooltip: 'Immutable create/update/delete log with IP and user attribution.',
      },
    ],
  },
  {
    id: 'automation',
    title: 'Automation & AI',
    tooltip: 'Workflows, agents, and human-in-the-loop gates.',
    links: [
      {
        label: 'Workflows',
        href: '/dashboard/workflows',
        tooltip: 'State-machine wizards for deals, foreclosures, listing entry, offers.',
      },
      {
        label: 'Listing Entry',
        href: '/dashboard/workflows/listing-entry',
        tooltip: 'Step-by-step MLS listing creation wizard with photo upload and validation.',
      },
      {
        label: 'Offer Draft',
        href: '/dashboard/workflows/offer-draft',
        tooltip: 'Purchase agreement generator with e-sign routing and compliance checks.',
      },
      {
        label: 'Agent Studio',
        href: '/dashboard/agent-studio',
        tooltip: 'Configure AI agents with tools, memory, and deployment targets.',
      },
      {
        label: 'AgentCore Console',
        href: '/dashboard/agentcore',
        tooltip: 'Live agent command console and visual workflow builder.',
        badge: 'AI',
      },
      {
        label: 'Approvals',
        href: '/dashboard/approvals',
        tooltip: 'Human review gates for offers, listings, and marketing content.',
      },
      {
        label: 'Segments',
        href: '/dashboard/segments',
        tooltip: 'Saved dynamic lists that power campaigns, exports, and bulk actions.',
      },
    ],
  },
  {
    id: 'platform',
    title: 'Platform',
    tooltip: 'Websites, partners, integrations, and system settings.',
    links: [
      {
        label: 'Agent Websites',
        href: '/dashboard/agent-websites',
        tooltip: 'Multi-tenant site builder with IDX, chat widget, and lead capture.',
      },
      {
        label: 'Website Builder',
        href: '/dashboard/websites/builder',
        tooltip: 'Drag-and-drop WYSIWYG for pages, templates, and landing funnels.',
      },
      {
        label: 'Partners',
        href: '/dashboard/partners',
        tooltip: 'Mortgage/title/insurance network with referral tracking.',
      },
      {
        label: 'Integrations',
        href: '/dashboard/settings/integrations',
        tooltip: 'MyPlusLeads, HubSpot, Salesforce, Lofty sync configuration.',
      },
      {
        label: 'Settings',
        href: '/dashboard/settings',
        tooltip: 'Email, voice, AI model keys, and MCP server configuration.',
      },
      {
        label: 'Sync Queue',
        href: '/dashboard/sync-queue',
        tooltip: 'Outbound sync job history with retry status and error traces.',
      },
      {
        label: 'Help Center',
        href: '/dashboard/help-center',
        tooltip: 'Searchable help articles and contextual guidance.',
      },
    ],
  },
];

function InfoBadge({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="About this section"
          className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-border/60 text-[8px] font-bold text-muted-foreground/70 hover:bg-muted hover:text-foreground transition-colors"
        >
          i
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-[220px]">
        <p className="text-xs leading-relaxed">{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={150}>
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {GROUPS.map((group) => (
          <div key={group.id}>
            <div className="flex items-center gap-1.5 px-2 mb-1.5">
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">
                {group.title}
              </span>
              <InfoBadge text={group.tooltip} />
            </div>
            <div className="space-y-0.5">
              {group.links.map((link) => {
                const isActive =
                  link.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname === link.href || pathname.startsWith(link.href + '/') ||
                      pathname.startsWith(link.href + '?') ||
                      // handle tab links like /dashboard/agent-websites?tab=...
                      (link.href.includes('?') && pathname === link.href.split('?')[0]);
                return (
                  <Tooltip key={link.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={link.href}
                        className={
                          'flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ' +
                          (isActive
                            ? 'bg-primary/15 text-primary border border-primary/25'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent')
                        }
                      >
                        <span className="truncate">{link.label}</span>
                        {link.badge && (
                          <span className="rounded-full bg-indigo-500/15 px-1 py-0 text-[8px] font-black uppercase text-indigo-500">
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[220px]">
                      <p className="text-xs leading-relaxed">{link.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </TooltipProvider>
  );
}

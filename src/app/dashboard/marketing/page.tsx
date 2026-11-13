'use client';

/**
 * Unified Marketing & Funnels Hub (`/dashboard/marketing`).
 *
 * Consolidates the 10-channel Marketing Studio, SMS Sign Riders & Keyword Text
 * Codes, and Public Lead-Magnet / High-Ticket Trust Funnels (`/trust-services`
 * & `/trust-course`) into one single-page tabbed console. Syncs with `?tab=`
 * so deep links (`/dashboard/marketing?tab=text-codes`, `?tab=funnels`) open
 * directly to the right tool.
 */

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import MarketingStudioPage from '@/app/dashboard/marketing-studio/page';
import TextCodes from '@/components/dashboard/TextCodes';
import toast from 'react-hot-toast';

type MarketingTabId = 'studio' | 'text-codes' | 'funnels';

const MARKETING_TABS: {
  id: MarketingTabId;
  label: string;
  icon: string;
  tooltip: string;
}[] = [
  {
    id: 'studio',
    label: 'Studio & 10 Channels',
    icon: '🎨',
    tooltip: 'Central creative hub: ContentPlanner analytics, AI post/blog/video creation, social scheduler, and LegacyLeads.',
  },
  {
    id: 'text-codes',
    label: 'SMS Sign Riders & Text Codes',
    icon: '💬',
    tooltip: 'Create yard-sign SMS keywords (e.g. 8485SHERMAN) that auto-reply with property links and capture leads into the CRM.',
  },
  {
    id: 'funnels',
    label: 'Trust Services & Public Funnels',
    icon: '🏛️',
    tooltip: 'Shareable high-converting public funnels: TSF Master Bundle ($0 / $997 / $1,497), Trust Funding 101 ($0 / $497), and Client Portal.',
  },
];

const PUBLIC_FUNNELS = [
  {
    title: 'TSF Master Bundle — Personal Property Trust Services',
    badge: 'Flagship • $0 / $997 / $1,497',
    path: '/trust-services',
    icon: '🏛️',
    summary:
      'Complete public funnel offering the free branded 3-document Personal Property Trust kit (Declaration, Appointment of Trustee, Affidavit & Certificate), 8-module funding course, $997 Done-With-You trust assembly, and $1,497 TSF Master Bundle with attorney-review routing.',
    tooltip:
      'Every form submission on /trust-services creates a tagged CRM Lead with tier & source attribution so your team can follow up immediately.',
  },
  {
    title: 'Trust Funding 101 — Mini-Course & 1-on-1 Package',
    badge: 'Lead Magnet • Free / $497',
    path: '/trust-course',
    icon: '🎓',
    summary:
      'Educational trust-funding funnel with free mini-course enrollment, $497 1-on-1 Guided Package, and consultation booking wired directly into your Leads pipeline.',
    tooltip:
      'Share on social posts, email signatures, or SMS campaigns to capture high-intent homeowner and investor leads.',
  },
  {
    title: 'Branded Client Transaction Portal',
    badge: 'Client Experience',
    path: '/portal',
    icon: '🌐',
    summary:
      'White-label client-facing portal displaying workspace branding, shared listings, e-sign disclosures, and transaction progress.',
    tooltip:
      'Customize colors, logo, and portal slug in Settings -> Branding.',
  },
];

function FunnelsPanel() {
  const copyLink = (path: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://excellegacyrealtygroup.site';
    navigator.clipboard.writeText(`${origin}${path}`);
    toast.success(`Copied ${origin}${path}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            Trust Services & Public Lead Funnels
            <span
              title="Public conversion pages hosted directly by the CRM. Submissions automatically create scored CRM leads with source tags."
              aria-label="About Public Lead Funnels"
              className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[9px] font-bold text-muted-foreground cursor-help"
            >
              ?
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            High-value public landing pages wired straight into Lead Intake &amp; Smart Plans.
          </p>
        </div>
        <Link
          href="/dashboard/leads"
          className="self-start sm:self-auto rounded-lg bg-primary text-primary-foreground px-3.5 py-2 text-xs font-bold hover:bg-primary/90 transition-colors"
        >
          View Captured Funnel Leads →
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {PUBLIC_FUNNELS.map((f) => (
          <div
            key={f.path}
            className="rounded-xl border border-border bg-background p-5 flex flex-col justify-between gap-4 hover:border-primary/40 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-2xl leading-none" aria-hidden>
                  {f.icon}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                    {f.badge}
                  </span>
                  <span
                    title={f.tooltip}
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[9px] font-bold text-muted-foreground cursor-help"
                  >
                    i
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">{f.title}</h3>
                <p className="text-xs font-mono text-primary mt-0.5">{f.path}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.summary}</p>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-border/50">
              <Link
                href={f.path}
                target="_blank"
                className="flex-1 text-center rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-bold hover:bg-primary/90 transition-colors"
              >
                Open Live Page ↗
              </Link>
              <button
                type="button"
                onClick={() => copyLink(f.path)}
                className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Copy full public URL to clipboard"
              >
                Copy URL
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarketingHubInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab') as MarketingTabId | null;
  const [activeTab, setActiveTab] = useState<MarketingTabId>(() =>
    tabParam && MARKETING_TABS.some((t) => t.id === tabParam) ? tabParam : 'studio',
  );

  useEffect(() => {
    if (tabParam && MARKETING_TABS.some((t) => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const selectTab = (id: MarketingTabId) => {
    setActiveTab(id);
    router.replace(`/dashboard/marketing?tab=${id}`, { scroll: false });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Unified Header + Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Marketing &amp; Growth Hub
            <span
              title="Unified marketing workspace combining the 10-channel Studio, SMS yard-sign text codes, and public Trust & Portal lead funnels on a single page."
              aria-label="About Marketing and Growth Hub"
              className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[9px] font-bold text-muted-foreground cursor-help"
            >
              ?
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Omnichannel content creation, SMS keyword capture, and high-ticket lead funnels in one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Marketing Hub sections">
          {MARKETING_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                title={tab.tooltip}
                onClick={() => selectTab(tab.id)}
                className={
                  'flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ' +
                  (isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60')
                }
              >
                <span aria-hidden>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'studio' && <MarketingStudioPage />}
      {activeTab === 'text-codes' && <TextCodes />}
      {activeTab === 'funnels' && <FunnelsPanel />}
    </div>
  );
}

export default function MarketingPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading Marketing Hub...</div>}>
      <MarketingHubInner />
    </Suspense>
  );
}

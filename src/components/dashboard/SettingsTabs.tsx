"use client";

/**
 * SettingsTabs — single-page settings surface.
 *
 * Tabs the five configuration domains that previously lived on separate
 * routes. Each tab shows the same forms as the standalone pages (linked
 * for deep-links) plus a description of when to touch it.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SettingsTab {
  id: string;
  label: string;
  description: string;
  tooltip: string;
  href: string;
  icon: string;
}

const TABS: SettingsTab[] = [
  {
    id: 'integrations',
    label: 'Lead Integrations',
    description: 'MyPlusLeads, HubSpot, Salesforce, Lofty, and webhook endpoints.',
    tooltip:
      'Wire external lead sources into the CRM. MyPlusLeads runs an hourly cron with a high-frequency morning window. Webhooks fire on new-lead events.',
    href: '/dashboard/settings/integrations',
    icon: '🔌',
  },
  {
    id: 'email',
    label: 'Email',
    description: 'SendGrid/SMTP sender identity, templates, and magic-link auth.',
    tooltip:
      'Configure the sending domain and templates. Auth magic links and campaign emails both use these settings.',
    href: '/dashboard/settings/email',
    icon: '📧',
  },
  {
    id: 'voice',
    label: 'Voice & Speech',
    description: 'Speech provider (OpenAI / ElevenLabs), accent profiles, call recording.',
    tooltip:
      'Pick TTS/STT providers and configure accent morphing for outbound calls. Voice sessions write back to the CRM timeline.',
    href: '/dashboard/settings/voice',
    icon: '🎙️',
  },
  {
    id: 'ai-models',
    label: 'AI Model Keys',
    description: 'Gemini, OpenAI, and custom model endpoint credentials.',
    tooltip:
      'The co-pilot defaults to Gemini 2.0 Flash. Override per-agent in Agent Studio if a task needs a different model.',
    href: '/dashboard/settings/ai-models',
    icon: '🔑',
  },
  {
    id: 'ai-memory',
    label: 'AI Memory',
    description: 'Control what the AI remembers, learning preferences, and data retention.',
    tooltip:
      'Manage conversation memory retention, enable/disable AI learning and personalization, set custom instructions, and export or delete your AI data.',
    href: '/dashboard/settings/ai-memory',
    icon: '🧠',
  },
  {
    id: 'mcp',
    label: 'MCP Server',
    description: 'Model Context Protocol exposure for external agent tools.',
    tooltip:
      'Expose CRM tools to MCP-compatible agents (Claude, Cursor, etc.). Controls which tools external agents may invoke.',
    href: '/dashboard/settings/mcp',
    icon: '🧩',
  },
];

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

export default function SettingsTabs() {
  const [active, setActive] = useState('integrations');
  const current = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            All configuration in one place. Each tab below is also available as a
            standalone page for bookmarks and deep links.
          </p>
        </div>

        {/* Tab rail */}
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((tab) => {
            const isActive = tab.id === active;
            return (
              <Tooltip key={tab.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setActive(tab.id)}
                    className={
                      'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ' +
                      (isActive
                        ? 'bg-primary/15 text-primary border border-primary/30'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent')
                    }
                  >
                    <span aria-hidden>{tab.icon}</span>
                    {tab.label}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-xs leading-relaxed">{tab.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Active tab detail */}
        <div className="rounded-xl border border-border bg-background p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span aria-hidden>{current.icon}</span>
                {current.label}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">{current.description}</p>
            </div>
            <InfoBadge text={current.tooltip} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={current.href}
              className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              Open full {current.label} page →
            </Link>
            <Link
              href={current.href + '?embed=1'}
              className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              View raw configuration
            </Link>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Tip:</strong> changes on the full
            page apply immediately — there is no separate save step for most
            settings. If a setting has an <em>Apply</em> button, it is
            intentionally gated so you can review before it takes effect.
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

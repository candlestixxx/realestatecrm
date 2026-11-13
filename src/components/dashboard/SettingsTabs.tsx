"use client";

/**
 * SettingsTabs — true single-page inline settings console.
 *
 * Renders all 10 configuration domains directly inline on `/dashboard/settings`
 * (synced with `?tab=` query param and `#hash` anchors) while preserving links
 * to the standalone deep routes for bookmarks.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import RoutingRulesWidget from '@/components/RoutingRulesWidget';
import BrandingSettingsPage from '@/app/dashboard/settings/branding/page';
import TeamSettingsPage from '@/app/dashboard/settings/team/page';
import IntegrationCenterClient from '@/components/IntegrationCenterClient';
import MlsConnectionForm from '@/components/MlsConnectionForm';
import EmailSettingsClient from '@/components/EmailSettingsClient';
import { VoiceSettingsClient } from '@/components/VoiceSettingsClient';
import AIModelsSettingsClient from '@/components/AIModelsSettingsClient';
import AILearningMemory from '@/components/AILearningMemory';
import MCPSettingsClient from '@/components/MCPSettingsClient';
import type { EmailConfig } from '@/lib/email-config';
import type { VoiceConfig } from '@/lib/voice-config';
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
  standalone?: boolean;
  icon: string;
}

const TABS: SettingsTab[] = [
  {
    id: 'integrations',
    label: 'Lead & MLS Integrations',
    description: 'MyPlusLeads hourly sync, RESO MLS credentials, partner connectors, and relist alerts.',
    tooltip:
      'Wire external lead and MLS feeds into the CRM. MyPlusLeads runs an hourly cron with a high-frequency morning window; RESO MLS powers property search and comps.',
    href: '/dashboard/settings/integrations',
    standalone: true,
    icon: '🔌',
  },
  {
    id: 'ai-models',
    label: 'AI Model Keys',
    description: 'Gemini, OpenAI, DeepSeek, and custom model endpoint credentials.',
    tooltip:
      'Configure provider API keys for the AI co-pilot, lead qualification, content generation, and Agent Studio personas.',
    href: '/dashboard/settings/ai-models',
    standalone: true,
    icon: '🔑',
  },
  {
    id: 'voice',
    label: 'Voice & Speech',
    description: 'Speech provider (OpenAI / ElevenLabs), regional accent morphing, and call recording.',
    tooltip:
      'Pick TTS/STT providers and test area-code accent morphing for outbound calls. Voice sessions log transcripts back to the lead timeline.',
    href: '/dashboard/settings/voice',
    standalone: true,
    icon: '🎙️',
  },
  {
    id: 'email',
    label: 'Email & SMTP',
    description: 'AWS SES, SMTP, or Resend sender identity, test dispatch, and magic-link auth.',
    tooltip:
      'Configure outbound sending domains and credentials. Both transactional magic-link auth emails and Smart Plan drip steps use this sender.',
    href: '/dashboard/settings/email',
    standalone: true,
    icon: '📧',
  },
  {
    id: 'branding',
    label: 'Branding',
    description: 'Brokerage name, logo, colors, client portal slug, and outbound email footer.',
    tooltip:
      'White-label branding shown live on the client portal (/portal), e-signing pages (/sign/*), and campaign email footers.',
    href: '/dashboard/settings/branding',
    standalone: true,
    icon: '🎨',
  },
  {
    id: 'team',
    label: 'Team & Roles',
    description: 'Invite agents, assign brokerage hierarchy roles, and reset member passwords.',
    tooltip:
      'Workspace RBAC management across Owner, Broker, Associate Broker, Realtor Agent, Agent, and Office Manager roles. Protects the last workspace Owner.',
    href: '/dashboard/settings/team',
    standalone: true,
    icon: '👥',
  },
  {
    id: 'routing',
    label: 'Lead Routing',
    description: 'Automatic round-robin and source-based lead assignment rules for your team.',
    tooltip:
      'Create rules that automatically route incoming webhook and MyPlusLeads records to specific agents based on lead source or criteria.',
    href: '/dashboard/settings?tab=routing',
    standalone: false,
    icon: '🔀',
  },
  {
    id: 'ai-memory',
    label: 'AI Memory',
    description: 'Control what the AI co-pilot remembers, custom instructions, and retention windows.',
    tooltip:
      'Manage conversation memory retention, toggle AI personalization, set persistent brokerage instructions, and export or clear stored AI context.',
    href: '/dashboard/settings/ai-memory',
    standalone: true,
    icon: '🧠',
  },
  {
    id: 'mcp',
    label: 'MCP Server',
    description: 'Model Context Protocol tool exposure for external AI agents and IDEs.',
    tooltip:
      'Expose scoped CRM tools (leads, tasks, search, workflows) to MCP-compatible external clients with explicit permission controls.',
    href: '/dashboard/settings/mcp',
    standalone: true,
    icon: '🧩',
  },
  {
    id: 'folders',
    label: 'Folder Monitoring',
    description: 'Watched local and network folders for auto-importing MLS photos and deal files.',
    tooltip:
      'Monitor network shares, MLS download directories, and local folders for new property photos and PDFs to auto-classify into CRM records.',
    href: '/dashboard/settings?tab=folders',
    standalone: false,
    icon: '📁',
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

function FolderMonitoringPanel() {
  const [folders, setFolders] = useState<{ id: string; label: string; path: string; enabled: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/folder-detection')
      .then((r) => r.json())
      .then((d) => setFolders(d.watchFolders || []))
      .catch(() => setFolders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading watch folders...</p>;
  if (folders.length === 0) return <p className="text-sm text-muted-foreground">No watch folders configured.</p>;

  return (
    <div className="space-y-3">
      {folders.map((f) => (
        <div
          key={f.id}
          className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-3"
        >
          <div>
            <div className="text-sm font-semibold">{f.label}</div>
            <div className="text-xs text-muted-foreground font-mono">{f.path}</div>
          </div>
          <span
            className={
              'text-xs font-semibold px-2 py-1 rounded ' +
              (f.enabled ? 'bg-green-500/15 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground')
            }
          >
            {f.enabled ? 'Active' : 'Inactive'}
          </span>
        </div>
      ))}
    </div>
  );
}

export interface SettingsTabsProps {
  workspaceId?: string;
  integrationData?: unknown;
  emailConfig?: EmailConfig;
  voiceConfig?: VoiceConfig | null;
}

export default function SettingsTabs({
  workspaceId = 'default',
  integrationData = null,
  emailConfig,
  voiceConfig,
}: SettingsTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');
  const [active, setActive] = useState<string>(() => {
    if (tabParam && TABS.some((t) => t.id === tabParam)) return tabParam;
    return 'integrations';
  });

  useEffect(() => {
    if (tabParam && TABS.some((t) => t.id === tabParam)) {
      setActive(tabParam);
      return;
    }
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashId = window.location.hash.replace(/^#/, '');
      if (TABS.some((t) => t.id === hashId)) {
        setActive(hashId);
      }
    }
  }, [tabParam]);

  const selectTab = (id: string) => {
    setActive(id);
    router.replace(`/dashboard/settings?tab=${encodeURIComponent(id)}`, { scroll: false });
  };

  const current = TABS.find((t) => t.id === active) ?? TABS[0];

  const resolvedEmailConfig: EmailConfig = emailConfig ?? {
    provider: 'SIMULATION',
    fromEmail: 'info@excellegacyrealtygroup.site',
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Unified Settings Console</h1>
              <InfoBadge text="All 10 workspace, AI, communication, team, and integration panels live directly inline on this page. Select any tab below to edit without leaving the console." />
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Every configuration panel in one tabbed surface — no extra page hops required.
            </p>
          </div>
          {current.standalone && (
            <Link
              href={current.href}
              className="self-start sm:self-auto rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Open this panel on its dedicated standalone URL for bookmarking"
            >
              Standalone URL ↗
            </Link>
          )}
        </div>

        {/* Value-ordered tab rail */}
        <div className="flex flex-wrap gap-1.5 border-b border-border pb-3" role="tablist" aria-label="Settings domains">
          {TABS.map((tab) => {
            const isActive = tab.id === active;
            return (
              <Tooltip key={tab.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => selectTab(tab.id)}
                    className={
                      'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all cursor-pointer ' +
                      (isActive
                        ? 'bg-primary/15 text-primary border border-primary/30 shadow-xs'
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

        {/* Active inline configuration panel */}
        <div className="rounded-xl border border-border bg-background p-5 space-y-5">
          <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span aria-hidden>{current.icon}</span>
                {current.label}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">{current.description}</p>
            </div>
            <InfoBadge text={current.tooltip} />
          </div>

          {current.id === 'integrations' && (
            <div className="space-y-6">
              <IntegrationCenterClient initialData={integrationData} workspaceId={workspaceId} />
              <MlsConnectionForm />
            </div>
          )}

          {current.id === 'ai-models' && <AIModelsSettingsClient />}

          {current.id === 'voice' &&
            (voiceConfig ? (
              <VoiceSettingsClient initialConfig={voiceConfig} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Sign in with workspace access to configure VoiceForge TTS/STT providers.
              </p>
            ))}

          {current.id === 'email' && <EmailSettingsClient initialConfig={resolvedEmailConfig} />}

          {current.id === 'branding' && <BrandingSettingsPage />}

          {current.id === 'team' && <TeamSettingsPage />}

          {current.id === 'routing' && <RoutingRulesWidget />}

          {current.id === 'ai-memory' && <AILearningMemory />}

          {current.id === 'mcp' && <MCPSettingsClient />}

          {current.id === 'folders' && <FolderMonitoringPanel />}
        </div>
      </div>
    </TooltipProvider>
  );
}

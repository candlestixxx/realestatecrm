import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import WorkflowSessionsPanel from '@/components/WorkflowSessionsPanel';

export default async function WorkflowsPage() {
  const session = await getServerSession(authOptions);
  await requireWorkspaceAccess(session);

  const workflows = [
    {
      id: 'foreclosure-intake',
      title: 'Foreclosure Intake',
      description: 'Parse weekly Macomb & Bay County foreclosure notices with tax-assessor prefill into scored CRM leads.',
      tooltip: 'Guided intake wizard that extracts parcel IDs, auction dates, redemption windows, and owner details into your distressed-property pipeline.',
      href: '/dashboard/workflows/foreclosure-intake',
      icon: '⚖️',
      status: 'Ready',
    },
    {
      id: 'offer-draft',
      title: 'Offer Draft & E-Sign',
      description: 'Generate structured purchase agreements with contingencies, disclosures, and e-signature routing.',
      tooltip: 'Auto-populates buyer, property, earnest money, and financing terms from a Deal or Lead record and prepares an e-signable packet.',
      href: '/dashboard/workflows/offer-draft',
      icon: '📝',
      status: 'Ready',
    },
    {
      id: 'listing-entry',
      title: 'MLS Listing Entry',
      description: 'Step-by-step property intake, photo validation, AI remarks generation, and MLS/marketing prep.',
      tooltip: 'Validates bed/bath/sqft/price fields, organizes listing photos, and syncs directly to your Listings board and Marketing Studio.',
      href: '/dashboard/workflows/listing-entry',
      icon: '🏠',
      status: 'Ready',
    },
    {
      id: 'marketing-media',
      title: 'Media Studio Pipeline',
      description: 'Turn property photos into storyboards, branded social reels, AI voiceovers, and promo videos.',
      tooltip: 'Connects CRM listing assets to the MediaWorkflow FFmpeg & AI storyboard pipeline without leaving the dashboard shell.',
      href: '/dashboard/workflows/marketing-media',
      icon: '🎬',
      status: 'Ready',
    },
  ];

  const relatedAutomations = [
    {
      label: 'Smart Plans & Drip Sequences',
      desc: 'Automated multi-day SMS, email, and call-task follow-up plans.',
      href: '/dashboard/campaigns',
      icon: '📈',
    },
    {
      label: 'AgentCore Visual Flow Builder',
      desc: 'AI co-pilot command console and multi-step agent workflow canvas.',
      href: '/dashboard/agentcore',
      icon: '🤖',
    },
    {
      label: 'Lead Routing Rules',
      desc: 'Round-robin and source-based auto-assignment rules for new leads.',
      href: '/dashboard/settings?tab=routing',
      icon: '🔀',
    },
    {
      label: 'Human Approval Gates',
      desc: 'Review compliance-flagged offers, listings, and outbound posts.',
      href: '/dashboard/approvals',
      icon: '✋',
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Workflows &amp; Guided Wizards
            <span
              title="State-machine wizards for foreclosure intake, offer drafting, MLS listing entry, and property media production. Draft sessions persist automatically so you can pause and resume anytime."
              aria-label="About Workflows and Guided Wizards"
              className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[9px] font-bold text-muted-foreground cursor-help"
            >
              ?
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Step-by-step transaction wizards, resumable sessions, and connected CRM automations.
          </p>
        </div>
        <Link
          href="/dashboard/approvals"
          className="self-start sm:self-auto rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
        >
          Open Approval Queue →
        </Link>
      </div>

      {/* Guided Wizards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {workflows.map((wf) => (
          <div
            key={wf.id}
            className="bg-background border border-border rounded-xl shadow-xs overflow-hidden flex flex-col hover:border-primary/50 transition-colors group"
          >
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                  {wf.icon}
                </div>
                <span
                  title={wf.tooltip}
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[9px] font-bold text-muted-foreground cursor-help"
                >
                  i
                </span>
              </div>
              <h3 className="text-base font-bold mb-1.5 group-hover:text-primary transition-colors">
                {wf.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                {wf.description}
              </p>
            </div>
            <div className="px-5 py-3.5 bg-muted/20 border-t border-border flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 dark:text-green-400">
                ● {wf.status}
              </span>
              <Link
                href={wf.href}
                className="text-xs font-bold text-primary hover:underline"
              >
                Launch Wizard &rarr;
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Connected Automation Engines */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Connected Automation Engines
          </h2>
          <span
            title="Related automation tools across the CRM: time-delayed drip campaigns, visual AI agent flows, automatic lead routing, and human-in-the-loop approval gates."
            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[9px] font-bold text-muted-foreground cursor-help"
          >
            i
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {relatedAutomations.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-muted/30 transition-all group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg" aria-hidden>{item.icon}</span>
                <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                  {item.label}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Resumable workflow sessions */}
      <WorkflowSessionsPanel />
    </div>
  );
}

import Link from 'next/link';

const highlights = [
  'TypeScript-first web app and backend',
  'Luxury black / blue / gold design system',
  'Live dashboard records feeding workflow screens',
  'Prisma / Postgres-ready record layer',
  'MLS / Realist / BS&A / Realcomp parity planning',
];

const workflowCards = [
  {
    title: 'Offer Draft Screen',
    description:
      'Draft offers with source provenance, compliance checks, review gates, and CRM writeback.',
    href: '/workflows/offer-draft',
    accent: 'from-primary/20 to-secondary/10',
  },
  {
    title: 'Listing Entry Screen',
    description:
      'Prefill listings, attach media, validate records, and prepare a clean MLS submission.',
    href: '/workflows/listing-entry',
    accent: 'from-secondary/20 to-primary/10',
  },
  {
    title: 'Foreclosure Intake Screen',
    description:
      'Capture Legal News foreclosure notices, preserve the raw public record, and prep Lofty sync.',
    href: '/workflows/foreclosure-intake',
    accent: 'from-primary/15 to-secondary/20',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border bg-[radial-gradient(circle_at_top,_rgba(30,64,175,0.16),_transparent_32%)]">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary">
                RealEstateCRM build shell
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                  Excel Legacy Realty Group
                  <span className="block text-secondary">Command Center</span>
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                  A modular real-estate operating system for leads, listings, offers, workflows,
                  and partner collaboration — built as a premium TypeScript app with visible UI
                  shells that can keep expanding.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {highlights.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground transition-colors hover:opacity-90"
                >
                  Open Live Dashboard
                </Link>
                <Link
                  href="/workflows/offer-draft"
                  className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Open Offer Draft Screen
                </Link>
                <Link
                  href="/workflows/listing-entry"
                  className="rounded-lg border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  Open Listing Entry Screen
                </Link>
                <Link
                  href="/workflows/foreclosure-intake"
                  className="rounded-lg border border-secondary/30 bg-secondary/10 px-5 py-3 text-sm font-semibold text-secondary transition-colors hover:bg-secondary/15"
                >
                  Open Foreclosure Intake Screen
                </Link>
              </div>
            </div>
            <div className="grid w-full max-w-xl gap-4 rounded-3xl border border-border bg-background/90 p-5 shadow-sm md:grid-cols-2">
              {workflowCards.map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className={`rounded-2xl border border-border bg-gradient-to-br ${card.accent} p-5 transition-transform hover:-translate-y-0.5`}
                >
                  <h2 className="text-lg font-semibold text-foreground">{card.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.description}</p>
                  <span className="mt-4 inline-flex text-sm font-semibold text-secondary">
                    Open workflow →
                  </span>
                </Link>
              ))}
              <div className="rounded-2xl border border-border bg-muted/20 p-5 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Build status
                </p>
                <p className="mt-2 text-2xl font-bold text-foreground">Dashboard + CRM data live</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Route-aware workflow shells, backend persistence, and Prisma/Postgres scaffolding are
                  in place with local fallback support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

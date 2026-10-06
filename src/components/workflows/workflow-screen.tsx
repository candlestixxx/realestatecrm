import Link from 'next/link';
import type { ReactNode } from 'react';

type ActionTone = 'primary' | 'secondary' | 'ghost';

type ActionLink = {
  label: string;
  href: string;
  tone?: ActionTone;
};

type FieldRow = {
  label: string;
  value: string;
  source?: string;
  highlight?: boolean;
};

type BulletSection = {
  title: string;
  items: string[];
};

type WorkflowScreenProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  routeLabel: string;
  topActions: ActionLink[];
  leftSummaryTitle: string;
  leftSummary: FieldRow[];
  centerSections: BulletSection[];
  rightSections: BulletSection[];
  bottomActions: ActionLink[];
  wireframeMap: string[];
  mobileNotes: string[];
  footerNote?: string;
};

const toneStyles: Record<ActionTone, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:opacity-90',
  ghost: 'border border-border bg-background text-foreground hover:bg-muted',
};

function ActionButton({ action }: { action: ActionLink }) {
  return (
    <Link
      href={action.href}
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${toneStyles[action.tone ?? 'ghost']}`}
    >
      {action.label}
    </Link>
  );
}

function Panel({
  title,
  children,
  accent = false,
}: {
  title: string;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border p-5 shadow-sm ${
        accent ? 'border-secondary/40 bg-secondary/5' : 'border-border bg-background'
      }`}
    >
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SectionList({ section }: { section: BulletSection }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <h4 className="text-sm font-semibold text-foreground">{section.title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {items.length === 0 ? <div className="text-center py-8 text-gray-500 text-sm">No workflow steps configured yet.</div> : (section.items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-1 inline-block h-2 w-2 rounded-full bg-secondary" />
            <span>{item}</span>
          </li>
        )))}
      </ul>
    </div>
  );
}

function WireframeCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-4">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <span className="rounded-full border border-secondary/30 bg-secondary/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary">
          component map
        </span>
      </div>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="rounded-md bg-muted/30 px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SummaryRow({ row }: { row: FieldRow }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {row.label}
          </p>
          <p
            className={`mt-1 text-sm font-medium ${row.highlight ? 'text-secondary' : 'text-foreground'}`}
          >
            {row.value}
          </p>
        </div>
        {row.source ? (
          <span className="rounded-full border border-border bg-background px-2 py-1 text-[11px] font-semibold text-muted-foreground">
            {row.source}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function WorkflowScreen({
  eyebrow,
  title,
  subtitle,
  routeLabel,
  topActions,
  leftSummaryTitle,
  leftSummary,
  centerSections,
  rightSections,
  bottomActions,
  wireframeMap,
  mobileNotes,
  footerNote,
}: WorkflowScreenProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(30,64,175,0.14),_transparent_34%),linear-gradient(180deg,_var(--background),_var(--background))] text-foreground">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
        <header className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary">
                {eyebrow}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{routeLabel}</p>
                <h1 className="text-3xl font-bold tracking-tight md:text-5xl">{title}</h1>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
                  {subtitle}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {topActions.map((action) => (
                <ActionButton key={action.label} action={action} />
              ))}
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
          <Panel title={leftSummaryTitle} accent>
            <div className="space-y-3">
              {leftSummary.map((row) => (
                <SummaryRow key={row.label} row={row} />
              ))}
            </div>
          </Panel>

          <div className="space-y-6">
            <Panel title="Wireframe-level component map">
              <div className="grid gap-3 md:grid-cols-2">
                {wireframeMap.map((item, index) => (
                  <WireframeCard
                    key={`${item}-${index}`}
                    title={`Layer ${index + 1}`}
                    items={item.split(' | ')}
                  />
                ))}
              </div>
            </Panel>

            <Panel title="Workflow surface">
              <div className="grid gap-4 lg:grid-cols-2">
                {centerSections.map((section) => (
                  <SectionList key={section.title} section={section} />
                ))}
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Review rail">
              <div className="space-y-4">
                {rightSections.map((section) => (
                  <SectionList key={section.title} section={section} />
                ))}
              </div>
            </Panel>

            <Panel title="Mobile notes">
              <ul className="space-y-3 text-sm text-muted-foreground">
                {mobileNotes.map((note) => (
                  <li key={note} className="flex gap-2">
                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-background p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Action bar
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                These are the buttons that should remain visible in the product UI so the workflow
                never feels buried.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {bottomActions.map((action) => (
                <ActionButton key={action.label} action={action} />
              ))}
            </div>
          </div>
        </section>

        {footerNote ? <p className="px-1 text-xs text-muted-foreground">{footerNote}</p> : null}
      </div>
    </main>
  );
}

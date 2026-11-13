import type { Metadata } from "next";
import Link from "next/link";
import { SECTOR_PACKS } from "@/lib/universal/sectors";
import { LANGUAGES, ADD_ONS, t } from "@/lib/universal/platform";

export const metadata: Metadata = {
  title: "Universal CRM for Every Business | United Beats LLC on HyperNexus",
  description:
    "One HyperNexus-driven CRM, tailored to any business: 8 sector packs (real estate, healthcare, legal, finance, construction, retail, hospitality, home services), 16 languages, white-label branding, and United Beats LLC add-ons.",
  alternates: { canonical: "https://excellegacyrealtygroup.site/universal" },
};

export default function UniversalPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b-4 border-secondary bg-accent text-accent-foreground">
        <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/excel-legacy-logo.png" alt="Excel Legacy Realty Group" className="h-20 w-20" />
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-secondary">United Beats LLC (Bob &amp; Lum) • Driven by HyperNexus</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">Universal CRM — every business, one harness.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-accent-foreground/80">
            Born inside the Excel Legacy real estate CRM. Now split into sector packs that speak your business&apos;s
            own words — your customers, your stages, your templates — in your language, under your brand.
            Three taps to anything, for every generation.
          </p>
          <p className="mt-4 text-sm text-secondary">{t("en", "tagline")} • {t("es", "tagline")} • {t("zh", "tagline")}</p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl space-y-14 px-4 py-12 md:px-6">
        <section>
          <h2 className="text-3xl font-bold">Pick your sector — we tailor the rest</h2>
          <div className="mt-6 space-y-4">
            {SECTOR_PACKS.map((s) => (
              <article key={s.id} className="border border-border p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-xl font-bold">{s.name}</h3>
                  <p className="text-xs font-semibold text-primary">{s.customer} → {s.workUnit} → {s.offering}</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{s.tagline}</p>
                <p className="mt-2 text-sm"><span className="font-semibold">Your pipeline:</span> {s.stages.join(" → ")}</p>
                <p className="mt-1 text-sm text-muted-foreground">Templates: {s.templates.join(" • ")} | Guardrails: {s.compliance.join("; ")}</p>
              </article>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-bold">Every language, one tap</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {LANGUAGES.map((l) => `${l.label} (${l.native})`).join(" • ")}. Arabic ships right-to-left.
            Your whole team and every customer see the CRM in their own words.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold">Add-ons by United Beats LLC (Bob &amp; Lum)</h2>
          <div className="mt-4 space-y-3">
            {ADD_ONS.map((a) => (
              <div key={a.id} className="flex flex-wrap items-baseline justify-between gap-2 border border-border p-4">
                <div><p className="font-bold">{a.name}</p><p className="text-sm text-muted-foreground">{a.blurb}</p></div>
                <p className="font-bold">{a.priceMonthly === 0 ? "Included in sector" : `$${a.priceMonthly}/mo`}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Real estate is where it started: <Link href="/trust-services" className="font-semibold text-primary underline">Trust, Security &amp; Future (TSF)</Link> and the{" "}
            <Link href="/dashboard" className="font-semibold text-primary underline">Excel Legacy Command Center</Link> run on this same harness today.
            Want your sector built? Your pack is a configuration, not a rebuild — talk to United Beats LLC.
          </p>
        </section>
      </div>
    </main>
  );
}

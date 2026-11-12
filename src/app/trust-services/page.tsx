import type { Metadata } from "next";
import Link from "next/link";
import TrustLeadForm from "@/components/trust/TrustLeadForm";
import LeadMagnetForm from "@/components/trust/LeadMagnetForm";

export const metadata: Metadata = {
  title: "Personal Property Trust Services, Documents & Complete Course | Excel Legacy Realty Group",
  description:
    "Excel Legacy Realty Group Trust Services: free branded Personal Property Trust documents (Declaration of Trust, Appointment of Trustee, Affidavit & Certificate of Trust), a complete trust funding course, and a $997 done-with-you trust assembly service by licensed Michigan realtors and brokers. Attorney review included in every path.",
  keywords: [
    "personal property trust", "declaration of trust template", "certificate of trust",
    "appointment of trustee", "trust funding course", "trust services Michigan",
    "Excel Legacy Realty Group", "fund your trust", "LLC trust assignment", "FinCEN CDD trust",
  ],
  openGraph: {
    title: "Trust Services | Excel Legacy Realty Group",
    description: "Branded trust documents, a complete course, and done-with-you trust assembly by the Excel Legacy Realty Team — from $0 to $997.",
    type: "website",
  },
  alternates: { canonical: "https://excellegacyrealtygroup.site/trust-services" },
};

const DOCS = [
  {
    title: "Declaration of Trust",
    file: "excel-legacy-declaration-of-trust",
    body: "The founding agreement: trustee powers, beneficiaries and percentages, power of direction, successor rules, and the Exhibit A schedule that actually funds the trust.",
    pages: "3 pages + Exhibit A",
  },
  {
    title: "Appointment of Trustee",
    file: "excel-legacy-appointment-of-trustee",
    body: "Appoints your initial and successor trustees by 100% of beneficiaries, with signed acceptance so banks and counterparties can rely on who is in charge.",
    pages: "2 pages",
  },
  {
    title: "Affidavit & Certificate of Trust",
    file: "excel-legacy-affidavit-certificate-of-trust",
    body: "The sworn certificate financial institutions ask for: trust authority, signing thresholds, tax ID, and FinCEN CDD beneficial-ownership authority — notarized.",
    pages: "2 pages",
  },
];

const MODULES = [
  { n: "01", title: "Why trusts fail — and the funding rule", lessons: ["The unfunded-trust trap", "Revocable vs. irrevocable in plain English", "What a personal property trust can and cannot hold"] },
  { n: "02", title: "Anatomy of the Declaration of Trust", lessons: ["Trustee powers, clause by clause", "Beneficiaries and percentages that total 100%", "Power of direction: who can order a sale or pledge"] },
  { n: "03", title: "Choosing trustees who can actually serve", lessons: ["Initial, co-trustee, and successor design", "The Appointment & Acceptance document", "Continuity when a trustee dies, resigns, or is incapacitated"] },
  { n: "04", title: "Exhibit A: funding with real assets", lessons: ["Assigning LLC and business interests to the trust", "Bank, merchant, and brokerage accounts", "Vehicles, equipment, notes, and intellectual property"] },
  { n: "05", title: "The Affidavit banks actually accept", lessons: ["Certificate of trust authority and signing thresholds", "FinCEN CDD beneficial-ownership disclosures", "Tax ID, EIN, and third-party reliance protection"] },
  { n: "06", title: "Execution day: signing and notarization", lessons: ["Who signs what, in what order", "Notary blocks and witness rules", "The mistakes that void a signing"] },
  { n: "07", title: "Your home, vehicles, and everything else", lessons: ["Deeding a home: lender call-first and title insurance", "Retitling vehicles without a coverage gap", "Retitle vs. POD/TOD for every account type"] },
  { n: "08", title: "Keep it funded for life", lessons: ["The one-page funding checklist habit", "The annual 20-minute trust review", "Amendment, removal, and the 20-year term"] },
];

const FAQS = [
  { q: "Are Excel Legacy realtors practicing law?", a: "No. Our licensed realtors and brokers assemble your documents from the facts you provide and teach you the mechanics, using professional real-estate insight on your property, LLC, and transaction history. Every path ends with an attorney-review checklist and referral — a licensed attorney in your state approves your documents before you sign." },
  { q: "Why $997 when attorneys charge $1,500–$3,500?", a: "Attorneys draft bespoke estate plans and bill for legal judgment. Our assembly service does the document preparation, asset scheduling, and funding coordination at a moderate flat price, then routes you to an attorney for review. Online kits run $399–$649 but leave assembly and funding entirely to you — that gap is exactly what the $997 service closes." },
  { q: "What does done-with-you assembly include?", a: "A fact-finding session with your Excel Legacy Realty Team member, completed Declaration of Trust, Appointment of Trustee, and Affidavit/Certificate drafts, your Exhibit A asset schedule, a personalized funding plan, notary-session coordination, and an attorney-review packet." },
  { q: "Is the free document kit really the full documents?", a: "Yes — the complete newly revised Declaration, Appointment, and Affidavit templates, Excel Legacy branded, in PDF and editable DOCX. We give them away because an assembled, funded trust — not a downloaded form — is what protects a family, and that is the service we sell." },
  { q: "Does this replace my estate attorney or CPA?", a: "Never. Trust taxation, creditor exposure, and state trust-code rules need licensed advice. Our course states this in lesson one and our service contract requires attorney review before execution." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Personal Property Trust Services",
  provider: { "@type": "RealEstateAgent", name: "Excel Legacy Realty Group", url: "https://excellegacyrealtygroup.site" },
  areaServed: "Michigan",
  description: metadata.description,
  offers: [
    { "@type": "Offer", name: "Branded Trust Document Kit", price: "0", priceCurrency: "USD" },
    { "@type": "Offer", name: "Complete Trust Course", price: "497", priceCurrency: "USD" },
    { "@type": "Offer", name: "Done-With-You Trust Assembly", price: "997", priceCurrency: "USD" },
    { "@type": "Offer", name: "Concierge Trust & Funding", price: "1497", priceCurrency: "USD" },
  ],
};

export default function TrustServicesPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="border-b-4 border-secondary bg-accent text-accent-foreground">
        <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/excel-legacy-logo.png" alt="The Excel Legacy Realty Group" className="h-24 w-24" />
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-secondary">The Excel Legacy Realty Group presents</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
            Trust, Security &amp; Future — the TSF Master Bundle
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-accent-foreground/80">
            For years, Michigan families have trusted the Excel Legacy Realty Team at the closing table. The TSF
            Master Bundle is that same trusted guidance, turned into a complete, realtor-taught system: the three
            newly revised trust documents, a full course any member of our team can teach, and done-with-you
            assembly — so your trust is signed, funded, and built to last.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#kit" className="bg-secondary px-5 py-3 text-sm font-bold text-black">Claim the free Starter Kit</a>
            <a href="#bundle" className="border border-accent-foreground/40 px-5 py-3 text-sm font-semibold">Master Bundle — $1,497 / clients $997</a>
          </div>
          <p className="mt-5 text-xs text-accent-foreground/60">Knowledge • Wisdom • Integrity — educational services only, not legal advice. Attorney review is built into every path.</p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-12 md:px-6">
        <section id="kit">
          <h2 className="text-3xl font-bold">Start free: the TSF Starter Kit</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Tell us where to send it and your Excel Legacy realtor will call to walk you through it — that call is
            where the value starts. Your kit unlocks instantly below: all three newly revised, Excel Legacy-branded
            trust documents plus the Master Bundle workbook preview.
          </p>
          <div className="mt-6 space-y-4">
            {DOCS.map((doc, i) => (
              <article key={doc.file} className="border border-border p-5">
                <p className="text-xs font-bold text-primary">Document {i + 1} of 3 — {doc.pages} — inside the kit</p>
                <h3 className="mt-1 text-xl font-bold">{doc.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{doc.body}</p>
              </article>
            ))}
          </div>
          <div className="mt-6 max-w-xl border-2 border-secondary p-5">
            <p className="mb-3 font-bold">Unlock the complete kit — free</p>
            <LeadMagnetForm />
          </div>
        </section>

        <section id="course">
          <h2 className="text-3xl font-bold">The complete course: Trust Funding, start to finish</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Eight modules and twenty-four lessons built directly on the three documents above — not theory.
            You finish with a signed, notarized, and funded trust, plus the annual habit that keeps every
            future asset inside it. Includes a live 60-minute 1-on-1 with the Excel Legacy Realty Team.
          </p>
          <div className="mt-6 grid gap-px border border-border bg-border md:grid-cols-2">
            {MODULES.map((m) => (
              <div key={m.n} className="bg-background p-5">
                <p className="text-xs font-bold text-secondary">Module {m.n}</p>
                <h3 className="mt-1 font-bold">{m.title}</h3>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {m.lessons.map((l) => <li key={l}>— {l}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-4 border-2 border-secondary p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-2xl font-bold" id="bundle">TSF Master Bundle — $1,497 standalone</p>
              <p className="text-sm text-muted-foreground">All 8 modules taught live by any Excel Legacy realtor, instructor guide + student workbook, funding checklist, document walkthroughs, session recording. Buying or selling with us? Your client price is $997 — ask your realtor.</p>
            </div>
            <div className="w-full max-w-md"><TrustLeadForm intent="course" cta="Enroll in the Master Bundle" /></div>
          </div>
        </section>

        <section id="assembly">
          <h2 className="text-3xl font-bold">Done-with-you trust assembly — $997 flat</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            This is the service our clients asked for. Your Excel Legacy realtor or broker sits with you — in
            person or on video — and assembles the necessary components from your documents and your actual
            assets: the Declaration, the trustee appointments, the bank-ready Affidavit, and a funded Exhibit A.
            You bring the facts; we bring licensed, professional real-estate insight and do the paperwork with you.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="border border-border p-5">
              <p className="font-bold">1. Fact-finding session</p>
              <p className="mt-1 text-sm text-muted-foreground">Trustees, beneficiaries, percentages, LLC interests, accounts, and property — mapped in one sitting.</p>
            </div>
            <div className="border border-border p-5">
              <p className="font-bold">2. Assembly + funding plan</p>
              <p className="mt-1 text-sm text-muted-foreground">All three documents completed from your facts, Exhibit A scheduled, and a step-by-step funding plan for every asset.</p>
            </div>
            <div className="border border-border p-5">
              <p className="font-bold">3. Attorney review + signing</p>
              <p className="mt-1 text-sm text-muted-foreground">Review packet and referral to a licensed attorney, then a coordinated notary signing session. Nothing is signed unreviewed.</p>
            </div>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full border border-border text-left text-sm">
              <thead><tr className="bg-muted"><th className="p-3">Path</th><th className="p-3">Typical market price</th><th className="p-3">Excel Legacy</th></tr></thead>
              <tbody>
                <tr className="border-t border-border"><td className="p-3">DIY forms / online kits</td><td className="p-3">$100–$649, assembly on you</td><td className="p-3 font-semibold">Free branded kit</td></tr>
                <tr className="border-t border-border"><td className="p-3">Taught complete course (standalone)</td><td className="p-3">Attorney packages $1,500–$3,500; instructor-led certs ~$1,599</td><td className="p-3 font-semibold">TSF Master Bundle $1,497</td></tr>
                <tr className="border-t-2 border-secondary bg-secondary/10"><td className="p-3 font-bold">Bundle as Excel Legacy client add-on (flagship)</td><td className="p-3">Same taught course + assembly, tied to your transaction</td><td className="p-3 font-bold">$997 client price</td></tr>
                <tr className="border-t border-border"><td className="p-3">Concierge: bundle + funding coordination + annual review</td><td className="p-3">$2,700+ estate packages</td><td className="p-3 font-semibold">+$500 over bundle</td></tr>
              </tbody>
            </table>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="border-2 border-secondary p-6">
              <p className="text-2xl font-bold">$997 — Trust Assembly</p>
              <p className="mt-1 text-sm text-muted-foreground">Three documents assembled, Exhibit A, funding plan, attorney packet, notary coordination.</p>
              <div className="mt-4"><TrustLeadForm intent="assembly" cta="Start my $997 assembly" /></div>
            </div>
            <div className="border border-border p-6">
              <p className="text-2xl font-bold">$1,497 — Concierge Funding</p>
              <p className="mt-1 text-sm text-muted-foreground">Everything in Assembly, plus deed/LLC/account funding coordination and your first annual review.</p>
              <div className="mt-4"><TrustLeadForm intent="concierge" cta="Go concierge — $1,497" /></div>
            </div>
          </div>
          <div className="mt-6 max-w-xl">
            <p className="mb-2 text-sm font-semibold">Not sure which path fits? Talk to the team first — free.</p>
            <TrustLeadForm intent="consult" cta="Schedule my free consultation" />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Michigan trust services, built by the people who close your homes</h2>
          <div className="mt-3 max-w-3xl space-y-4 text-sm leading-6 text-muted-foreground">
            <p>Excel Legacy Realty Group closes real estate across Michigan every week, and we see the same failure at the closing table and beyond: a family paid for a trust, signed it, and never funded it. The house was never deeded, the LLC was never assigned, the bank accounts were never retitled — so the trust controlled nothing and probate happened anyway. Our Trust Services exist to close that gap for every client who walks through our door, whether you bought your home with us or not.</p>
            <p>A personal property trust holds what a deed cannot: LLC and business membership interests, bank and brokerage accounts, vehicles, equipment, and intangible property. Our newly revised Declaration of Trust, Appointment of Trustee, and Affidavit &amp; Certificate of Trust cover trustee powers, beneficiary percentages, powers of direction, successor continuity, FinCEN CDD beneficial-ownership disclosures for banks, and third-party reliance protection. The free branded kit, the complete $497 course, and the $997 done-with-you assembly all teach and apply the same funding discipline: schedule it in Exhibit A, transfer it, verify it, and review it every year.</p>
            <p>We are realtors and brokers, not attorneys, and we say so on every page and every document. That honesty is the model: our team assembles and funds with licensed real-estate insight at a moderate flat price, and a licensed attorney reviews before anything is signed. It is how a real estate business should sell trust services — as the natural next step after the closing, at a price that helps more Michigan families actually finish the job.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Common questions</h2>
          <div className="mt-4 space-y-4">
            {FAQS.map((f) => (
              <div key={f.q} className="border border-border p-5">
                <h3 className="font-bold">{f.q}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs leading-5 text-muted-foreground">
            Educational content and document-assembly services only — not legal, tax, or financial advice, and no
            attorney-client relationship is created. Prices are flat service fees; attorney review, notary, and
            recording fees are separate. Have a licensed attorney in your governing state review your completed
            documents before you sign, notarize, or fund anything. Prefer self-study first?{" "}
            <Link href="/trust-course" className="font-semibold text-primary underline">Start with Trust Funding 101</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}


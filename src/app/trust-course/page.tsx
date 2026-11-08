"use client";

import { useState } from "react";
import Link from "next/link";

const MINI_LESSONS = [
  { title: "Why trusts fail", body: "A signed trust that was never funded still goes through probate. Funding - moving ownership - is the whole ballgame." },
  { title: "Your home", body: "Deeding the house into the trustee name, calling the lender first, keeping title insurance intact, plus Michigan transfer-tax notes." },
  { title: "Your business / LLC", body: "Assigning your membership interest to the trustee and amending the operating agreement so the trust is the member of record." },
  { title: "Your vehicles", body: "Retitling cars, trucks, and toys into the trust, lienholder consent, and updating insurance so coverage never gaps." },
  { title: "Accounts and everything else", body: "Bank and investment accounts: retitle vs. payable-on-death and transfer-on-death designations - which lever for which account." },
  { title: "The funding checklist habit", body: "A one-page checklist plus an annual 20-minute review so every new asset lands in the trust the week you buy it." },
];

const FULL_INCLUDES = [
  "Everything in the free mini-course, in full detail",
  "Live 60-minute 1-on-1 training with the Excel Legacy Realty team",
  "Personalized funding checklist for your home, business, and vehicles",
  "Document walkthrough: deed, assignment of membership interest, title forms",
  "Attorney referral and review checklist before you sign anything",
  "Recording: your session, yours to keep",
];

function CaptureForm({ intent, cta }: { intent: "mini" | "full" | "consult"; cta: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const copy =
    intent === "mini"
      ? { source: "Trust Mini-Course", notes: "Trust Funding 101 mini-course enrollment (free lead magnet).", done: "You are in! Check your email - your first lesson and the funding checklist are on the way." }
      : intent === "full"
        ? { source: "Trust Full Package", notes: "Trust Funding full 1-on-1 package purchase intent ($497). Send secure invoice.", done: "Reserved! Our team will send your secure $497 invoice and booking link within one business day." }
        : { source: "Trust Consultation", notes: "Trust consultation request (free 20-min call with Excel Legacy Realty team).", done: "Request received! We will reach out within one business day to confirm your consultation time." };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setState("sending");
    try {
      const res = await fetch("/api/leads/external", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, notes: copy.notes, source: copy.source }),
      });
      if (!res.ok) throw new Error("request failed");
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return <p className="rounded-xl border border-secondary/40 bg-secondary/10 px-4 py-3 text-sm font-medium">{copy.done}</p>;
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email address" required className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
      </div>
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
      <button type="submit" disabled={state === "sending"} className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-black disabled:opacity-60">
        {state === "sending" ? "Sending..." : cta}
      </button>
      {state === "error" && <p className="text-xs text-red-500">Something went wrong - please try again.</p>}
    </form>
  );
}

export default function TrustCoursePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border bg-[radial-gradient(circle_at_top,_rgba(30,64,175,0.16),_transparent_32%)]">
        <div className="mx-auto max-w-5xl px-4 py-12 md:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary">
            Excel Legacy Realty Group
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Trust Funding 101
            <span className="block text-secondary text-2xl md:text-3xl mt-2">Put your home, business, and vehicles in your trust - the right way</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            Most trusts fail for one boring reason: they never get funded. This course shows homeowners exactly how to move each asset into the trust - and what to verify so it actually counts.
          </p>
          <p className="mt-3 max-w-2xl text-xs leading-5 text-muted-foreground">
            Educational content only - not legal advice. Have an attorney review your documents before you sign anything.
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 space-y-12">
        <section className="rounded-2xl border border-border p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl font-bold">Mini-course - free</h2>
            <span className="rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">Lead magnet</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Six short lessons plus a one-page funding checklist. Free when you join our list.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {MINI_LESSONS.map((lesson, i) => (
              <div key={lesson.title} className="rounded-xl border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-secondary">Lesson {i + 1}</p>
                <h3 className="mt-1 font-semibold">{lesson.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{lesson.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 max-w-xl">
            <CaptureForm intent="mini" cta="Send me the free mini-course" />
          </div>
        </section>
        <section className="rounded-2xl border border-secondary/40 p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl font-bold">Full package - 1-on-1 training</h2>
            <span className="text-2xl font-bold text-secondary">$497</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Work directly with the Excel Legacy Realty team to fund your trust correctly, with your actual assets on the table.</p>
          <ul className="mt-4 space-y-2">
            {FULL_INCLUDES.map((item) => (
              <li key={item} className="flex gap-2 text-sm"><span className="text-secondary">X</span><span>{item}</span></li>
            ))}
          </ul>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 font-semibold text-sm uppercase tracking-widest text-secondary">Buy the package</h3>
              <CaptureForm intent="full" cta="Buy now - $497" />
              <p className="mt-2 text-xs text-muted-foreground">Reserve now; pay securely by invoice. No payment taken on this page.</p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-sm uppercase tracking-widest text-secondary">Or start with a free consult</h3>
              <CaptureForm intent="consult" cta="Schedule my free consultation" />
              <p className="mt-2 text-xs text-muted-foreground">20 minutes with our team. We will confirm your time within one business day.</p>
            </div>
          </div>
        </section>
        <section className="rounded-2xl border border-border p-6">
          <h2 className="text-xl font-bold">Common questions</h2>
          <div className="mt-3 space-y-3 text-sm text-muted-foreground">
            <p><span className="font-semibold text-foreground">Do I need a trust before this course? </span>No. The mini-course helps you understand funding; the full package assumes your trust is signed or in progress with an attorney.</p>
            <p><span className="font-semibold text-foreground">Does this replace my attorney? </span>Never. We teach the mechanics and the checklist; your attorney approves your documents.</p>
            <p><span className="font-semibold text-foreground">What if my home has a mortgage? </span>Covered in lesson 2: lender call-first, due-on-transfer awareness, and keeping title insurance continuous.</p>
          </div>
          <div className="mt-4">
            <Link href="/dashboard" className="text-sm text-secondary underline">Already a client? Open your Command Center</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

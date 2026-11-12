"use client";

import { useState } from "react";

export type TrustIntent = "kit" | "course" | "assembly" | "concierge" | "consult";

const COPY: Record<TrustIntent, { source: string; notes: string; done: string }> = {
  kit: {
    source: "Trust Document Kit",
    notes: "Free branded trust document kit download (Declaration, Appointment of Trustee, Affidavit/Certificate).",
    done: "Your kit is ready — use the download buttons above. We also emailed your link and the funding checklist.",
  },
  course: {
    source: "Trust Complete Course",
    notes: "TSF Master Bundle enrollment intent ($1,497 standalone / $997 Excel Legacy client). Send secure invoice and enrollment link.",
    done: "Reserved! We will send your secure invoice and course access within one business day.",
  },
  assembly: {
    source: "Trust Done-With-You Assembly",
    notes: "Done-With-You Personal Property Trust Assembly ($997): realtor/broker assembles Declaration, Appointment, Affidavit + Exhibit A from client facts. Attorney review required before signing.",
    done: "Request received! An Excel Legacy Realty Team member will contact you within one business day to start your $997 assembly.",
  },
  concierge: {
    source: "Trust Concierge Funding",
    notes: "Concierge Trust & Funding ($1,497): assembly plus deed/LLC/account funding coordination and annual review.",
    done: "Request received! Our team will contact you within one business day to plan your $1,497 concierge engagement.",
  },
  consult: {
    source: "Trust Consultation",
    notes: "Free 20-min trust services consultation with Excel Legacy Realty Team.",
    done: "Request received! We will reach out within one business day to confirm your consultation time.",
  },
};

export default function TrustLeadForm({ intent, cta }: { intent: TrustIntent; cta: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const copy = COPY[intent];

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
    return <p className="border border-secondary/40 bg-secondary/10 px-4 py-3 text-sm font-medium">{copy.done}</p>;
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required className="border border-border bg-background px-3 py-2 text-sm" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email address" required className="border border-border bg-background px-3 py-2 text-sm" />
      </div>
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className="border border-border bg-background px-3 py-2 text-sm" />
      <button type="submit" disabled={state === "sending"} className="bg-secondary px-4 py-2 text-sm font-semibold text-black disabled:opacity-60">
        {state === "sending" ? "Sending..." : cta}
      </button>
      {state === "error" && <p className="text-xs text-red-500">Something went wrong — please try again.</p>}
    </form>
  );
}

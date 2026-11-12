"use client";

import { useState } from "react";

const DOCS = [
  { label: "Declaration of Trust (PDF)", href: "/trust-docs/excel-legacy-declaration-of-trust.pdf" },
  { label: "Declaration of Trust (DOCX)", href: "/trust-docs/excel-legacy-declaration-of-trust.docx" },
  { label: "Appointment of Trustee (PDF)", href: "/trust-docs/excel-legacy-appointment-of-trustee.pdf" },
  { label: "Appointment of Trustee (DOCX)", href: "/trust-docs/excel-legacy-appointment-of-trustee.docx" },
  { label: "Affidavit & Certificate of Trust (PDF)", href: "/trust-docs/excel-legacy-affidavit-certificate-of-trust.pdf" },
  { label: "Affidavit & Certificate of Trust (DOCX)", href: "/trust-docs/excel-legacy-affidavit-certificate-of-trust.docx" },
  { label: "TSF Master Bundle — Instructor Guide (PDF)", href: "/trust-docs/tsf-master-bundle-instructor-guide.pdf" },
  { label: "TSF Master Bundle — Student Workbook (PDF)", href: "/trust-docs/tsf-master-bundle-workbook.pdf" },
];

/** Lead magnet: full contact + property address in exchange for the kit. Phone is required and validated. */
export default function LeadMagnetForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", street: "", city: "", state: "MI", zip: "" });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [phoneError, setPhoneError] = useState("");
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length < 10) { setPhoneError("Please enter a good phone number with area code — your realtor will call to walk you through your kit."); return; }
    setPhoneError("");
    setState("sending");
    try {
      const res = await fetch("/api/leads/external", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(),
          source: "TSF Lead Magnet Kit",
          notes: `Trust, Security & Future Starter Kit request. Property address: ${form.street.trim()}, ${form.city.trim()}, ${form.state} ${form.zip.trim()}. Phone verified format. Enroll in TSF nurture + realtor follow-up call.`,
        }),
      });
      if (!res.ok) throw new Error("request failed");
      setState("done");
    } catch { setState("error"); }
  }

  if (state === "done") {
    return (
      <div className="border border-secondary/40 bg-secondary/10 p-4">
        <p className="text-sm font-bold">Your Starter Kit is unlocked — download everything below.</p>
        <p className="mt-1 text-sm">A member of the Excel Legacy Realty Team will call you shortly to walk you through it. Check your email for your copies.</p>
        <ul className="mt-3 space-y-1 text-sm">
          {DOCS.map((d) => <li key={d.href}><a className="font-semibold text-primary underline" href={d.href}>{d.label}</a></li>)}
        </ul>
      </div>
    );
  }
  const input = "border border-border bg-background px-3 py-2 text-sm w-full";
  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <input value={form.name} onChange={set("name")} placeholder="Full name *" required className={input} />
        <input value={form.email} onChange={set("email")} type="email" placeholder="Email address *" required className={input} />
      </div>
      <input value={form.phone} onChange={set("phone")} type="tel" placeholder="Best phone number * (realtor follow-up)" required className={input} />
      {phoneError && <p className="text-xs font-semibold text-red-500">{phoneError}</p>}
      <input value={form.street} onChange={set("street")} placeholder="Property street address *" required className={input} />
      <div className="grid gap-2 sm:grid-cols-3">
        <input value={form.city} onChange={set("city")} placeholder="City *" required className={input} />
        <input value={form.state} onChange={set("state")} placeholder="State *" required className={input} />
        <input value={form.zip} onChange={set("zip")} placeholder="ZIP *" required className={input} />
      </div>
      <button type="submit" disabled={state === "sending"} className="bg-secondary px-4 py-3 text-sm font-bold text-black disabled:opacity-60">
        {state === "sending" ? "Unlocking..." : "Unlock my free Starter Kit"}
      </button>
      <p className="text-xs text-muted-foreground">By submitting you agree to be contacted by the Excel Legacy Realty Group about trust services and real estate. No spam, no obligation.</p>
      {state === "error" && <p className="text-xs text-red-500">Something went wrong — please try again.</p>}
    </form>
  );
}

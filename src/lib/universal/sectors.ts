/**
 * Universal CRM — sector packs.
 *
 * One HyperNexus-driven core (contacts, pipeline, comms, AI, automation);
 * a sector pack is pure configuration: vocabulary, pipeline stages,
 * templates, and compliance notes. Real Estate is Pack #1 — the original
 * CRM, expressed as data. New business = new pack, never a new app.
 * Customization & add-ons by United Beats LLC (Bob & Lum).
 */
export interface SectorPack {
  id: string;
  name: string;
  tagline: string;
  /** What a "customer" is called in this sector. */
  customer: string;
  /** What a "deal / job / case" is called. */
  workUnit: string;
  /** What is sold / served. */
  offering: string;
  stages: string[];
  templates: string[];
  compliance: string[];
  metrics: string[];
}

export const SECTOR_PACKS: SectorPack[] = [
  {
    id: "real-estate", name: "Real Estate", tagline: "The original Excel Legacy engine.",
    customer: "Client", workUnit: "Deal", offering: "Listing",
    stages: ["Lead", "Qualified", "Showing", "Offer", "Under Contract", "Closed", "Past Client"],
    templates: ["Buyer consultation", "Listing presentation", "Offer draft", "Trust funding (TSF)"],
    compliance: ["Fair Housing", "State license disclosure", "Trust documents need attorney review"],
    metrics: ["Listings", "Closings", "Commission", "Pipeline value"],
  },
  {
    id: "healthcare", name: "Healthcare & Clinics", tagline: "Patients in, care delivered, nobody lost to follow-up.",
    customer: "Patient", workUnit: "Case", offering: "Appointment",
    stages: ["Inquiry", "Intake", "Scheduled", "In Care", "Follow-Up", "Discharged", "Recall"],
    templates: ["Intake form", "Appointment reminder", "Care-plan follow-up", "Recall campaign"],
    compliance: ["HIPAA — never store PHI in free-text notes", "Consent before messaging", "Data retention policy"],
    metrics: ["Appointments", "No-show rate", "Recalls due", "Patient satisfaction"],
  },
  {
    id: "legal", name: "Legal Services", tagline: "From first call to signed matter, with deadlines that never slip.",
    customer: "Client", workUnit: "Matter", offering: "Consultation",
    stages: ["Lead", "Conflict Check", "Consultation", "Retained", "Active Matter", "Settled/Closed", "Referral Source"],
    templates: ["Intake questionnaire", "Engagement letter", "Deadline tracker", "Status update"],
    compliance: ["Attorney-client privilege", "Conflict check before intake", "Trust-account (IOLTA) separation"],
    metrics: ["Open matters", "Billable pipeline", "Deadlines this week", "Referrals"],
  },
  {
    id: "finance", name: "Finance & Insurance", tagline: "Prospects become policyholders, renewals never surprise you.",
    customer: "Policyholder", workUnit: "Policy", offering: "Quote",
    stages: ["Lead", "Discovery", "Quoted", "Bound/Bound Policy", "Onboarding", "Renewal Due", "Renewed"],
    templates: ["Needs analysis", "Quote follow-up", "Renewal reminder", "Annual review invite"],
    compliance: ["Licensed-producer disclosure", "Suitability notes", "No guaranteed-return language"],
    metrics: ["Quotes", "Bind rate", "Renewals due", "Book value"],
  },
  {
    id: "construction", name: "Construction & Trades", tagline: "Bids, jobs, and change orders — visible from field to office.",
    customer: "Customer", workUnit: "Job", offering: "Bid",
    stages: ["Lead", "Site Visit", "Bid Sent", "Won", "In Progress", "Punch List", "Complete & Paid"],
    templates: ["Bid proposal", "Change order", "Progress update photo log", "Final invoice"],
    compliance: ["License & insurance on file", "Written change orders only", "Lien-waiver tracking"],
    metrics: ["Open bids", "Jobs in progress", "Win rate", "Receivables"],
  },
  {
    id: "retail", name: "Retail & E-commerce", tagline: "One view of every shopper, cart, and repeat buyer.",
    customer: "Shopper", workUnit: "Order", offering: "Product",
    stages: ["Visitor", "Cart", "Checkout", "Fulfilled", "Repeat Buyer", "VIP", "Win-Back"],
    templates: ["Abandoned cart", "Order updates", "Review request", "VIP early access"],
    compliance: ["CAN-SPAM / consent for marketing", "Clear pricing & returns", "Payment data stays with processor"],
    metrics: ["Orders", "Repeat rate", "Average order value", "Win-backs"],
  },
  {
    id: "hospitality", name: "Hospitality & Events", tagline: "Bookings, guests, and events run like clockwork.",
    customer: "Guest", workUnit: "Booking", offering: "Reservation",
    stages: ["Inquiry", "Quoted", "Booked", "Confirmed", "In-House/Event Day", "Checked Out", "Loyalty"],
    templates: ["Booking confirmation", "Pre-arrival guide", "Event run sheet", "Review & rebook offer"],
    compliance: ["Deposit & cancellation terms in writing", "Accessibility requests honored", "ID/payment verification"],
    metrics: ["Bookings", "Occupancy", "Repeat guests", "Review score"],
  },
  {
    id: "home-services", name: "Home Services", tagline: "Calls become routes, routes become reviews.",
    customer: "Homeowner", workUnit: "Service Call", offering: "Service Plan",
    stages: ["Lead", "Booked", "Dispatched", "On Site", "Completed", "Maintenance Plan", "Seasonal Recall"],
    templates: ["Booking confirmation", "Tech en route", "Service summary", "Seasonal tune-up offer"],
    compliance: ["License disclosure", "Upfront pricing before work", "Warranty terms in writing"],
    metrics: ["Calls booked", "Jobs per tech", "Plan members", "Review score"],
  },
];

export function getSectorPack(id: string): SectorPack {
  return SECTOR_PACKS.find((s) => s.id === id) ?? SECTOR_PACKS[0];
}

export function validateSectorPack(pack: SectorPack): string[] {
  const errors: string[] = [];
  if (!pack.id || !/^[a-z0-9-]+$/.test(pack.id)) errors.push("id must be kebab-case");
  if (pack.stages.length < 3) errors.push("needs at least 3 stages");
  if (new Set(pack.stages).size !== pack.stages.length) errors.push("stages must be unique");
  if (!pack.customer || !pack.workUnit || !pack.offering) errors.push("vocabulary is required");
  return errors;
}

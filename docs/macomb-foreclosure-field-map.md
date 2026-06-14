# Macomb County Foreclosure Pipeline — Exact Field Map

## Goal
This document defines the exact source-to-internal-to-CRM mapping for the weekly Macomb County foreclosure workflow from Legal News into the RealEstateCRM pipeline and Lofty sync.

## Source of truth
- Source page: `https://www.legalnews.com/County/Notices?location=macomb`
- County bucket: **Foreclosures**
- Weekly date window: previous Saturday through current Friday
- Canonical record text: the full notice body copied from the Legal News notice page

## Source record anatomy from Legal News
Each notice may contain some or all of the following fields:
- mortgagor name
- co-mortgagor name(s)
- property address / commonly known address
- county
- notice type
- published date
- sale date
- amount due
- legal description
- attorney name
- law firm
- attorney phone number
- file number
- parcel / tax id
- redemption period
- source URL
- raw notice text

## Internal normalized object
Use this shape as the pipeline’s canonical internal record before CRM sync:

```ts
export type ForeclosureNoticeRecord = {
  source: 'legalnews-macomb';
  county: 'Macomb';
  noticeType: string;
  publishedDate: string; // YYYY-MM-DD
  saleDate: string | 'TBD';
  mortgagorName: string;
  coMortgagorNames: string[];
  propertyAddress: string;
  city: string | null;
  state: 'MI';
  zip: string | null;
  amountDue: number | null;
  amountDueText: string | null;
  legalDescription: string | null;
  attorneyName: string | null;
  lawFirm: string | null;
  attorneyPhone: string | null;
  fileNumber: string | null;
  parcelId: string | null;
  redemptionPeriod: string | null;
  sourceUrl: string;
  rawNoticeText: string;
  confidence: 'high' | 'medium' | 'review';
};
```

## Extraction rules
### 1) Notice header / identity
- The first visible name line is the **display mortgagor name**.
- If the notice explicitly says `Name(s) of the mortgagor(s):`, prefer that field over the visible heading.
- If multiple mortgagors are listed, store the full set in `coMortgagorNames` and keep the display name as the primary lead label.

### 2) Address
- Prefer `Property Address:` when present.
- Otherwise prefer `Commonly known as:` / `Common street address (if any):`.
- If the address appears only in the notice header line, use that as fallback.
- Keep the original formatted address text as the display string.

### 3) Published date
- Use the notice publication date from the notice metadata or date tag.
- Weekly run scope is determined by the publication date, not the sale date.

### 4) Sale date
- Extract the auction / sheriff sale date if present.
- If not present, set `saleDate = 'TBD'`.

### 5) Amount due
- Prefer the exact `Amount claimed to be due...` or equivalent line.
- Store both parsed numeric value and original text when possible.

### 6) Attorney / firm
- Extract attorney name, law firm, and phone number when present.
- If only a firm is named, keep `attorneyName = null` and store the firm.

### 7) Legal description / parcel data
- Keep the full legal description in `legalDescription`.
- Capture parcel / tax ID only when explicitly present.

### 8) Confidence
- `high` = name, address, amount due, and source date are all explicit.
- `medium` = one of those fields is inferred from fallback text.
- `review` = name or address is ambiguous and must be checked by a human.

## CRM mapping
### Contact
Map the person(s) in the notice into a Contact record.

- `Contact.firstName`
  - use the mortgagor display name as a single display string when a safe split is not available
  - split only when the notice clearly provides first and last name structure
- `Contact.lastName`
  - optional; leave null when unsafe to split
- `Contact.phone`
  - populate only after enrichment or if the notice explicitly provides a personal phone number
- `Contact.email`
  - leave null unless enrichment returns it

### Lead
Map the notice into a Lead record for the weekly foreclosure pipeline.

- `Lead.source` → `Legal News — Macomb Foreclosures`
- `Lead.status` → `PREFORECLOSURE`
- `Lead.score` → `0` initially
- `Lead.contactId` → linked contact
- `Lead.userId` → assigned agent, if already decided

### Activity
Create one note activity containing the raw public record.

- `Activity.type` → `NOTE`
- `Activity.content` → full raw notice text
- `Activity.metadata` → JSON with source URL, county, published date, sale date, amount due, attorney, law firm, parcel ID, and confidence

### Task
Create one follow-up task per lead after review.

- `Task.title` → `Review foreclosure notice and call lead`
- `Task.description` → include address, sale date, amount due, source URL, and attorney/firm
- `Task.status` → `TODO`
- `Task.dueDate` → next business day at 10:00 AM local time after the notice is published, unless overridden by business rules
- `Task.assignedToId` → assigned agent once routing is finalized

### Deal
Do not create a deal automatically in the first pass.
- Create a Deal only after human review or when the lead enters an active opportunity stage.
- If a Deal is created later, use the address or mortgagor name as the title and connect it to the same contact.

## Lofty sync mapping
Map the cleaned lead to Lofty as a preforeclosure contact/lead payload.

Recommended Lofty field groups:
- **Identity**
  - name
  - phone
  - email
- **Property**
  - property address
  - city
  - state
  - zip
  - county
- **Pipeline / status**
  - source = `Legal News`
  - segment = `PREFORECLOSURE`
  - disposition = `Preforeclosure`
  - tags include `#PreForeclosure`
- **Custom fields**
  - notice date
  - sale date
  - amount due
  - attorney / law firm
  - source URL
  - file number
  - parcel / tax ID
  - redemption period

## Deterministic tagging rules
Apply these tags when the record is created:
- `#PreForeclosure`
- `county:macomb`
- `source:legalnews`
- `notice_type:foreclosure`

If the notice is a lien foreclosure rather than a mortgage foreclosure, add:
- `notice_subtype:lien`

## Assignment rules
Until a separate routing policy is confirmed:
- keep the record in a review queue
- do not auto-sync to Lofty before the notice is validated
- route only validated records to the assigned agent

## Human review gates
A human must review the record when:
- the mortgagor name is unclear
- the address cannot be confidently parsed
- the notice type is not a standard mortgage foreclosure
- the sale date is missing but the record still needs outreach timing
- the record is a duplicate of a previously processed notice

## Implementation note
This field map is the bridge between:
1. Legal News source parsing
2. RealEstateCRM lead/contact/activity/task records
3. Lofty sync payloads
4. Weekly agent review and follow-up

The next implementation step is to wire a parser that converts raw Legal News notices into `ForeclosureNoticeRecord` objects, then persist them as lead/activity/task bundles before optional Lofty sync.
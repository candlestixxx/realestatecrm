# 03 — Foreclosure Intake Pipeline (Weekly)

## Overview

Every Friday at 12:00 PM Eastern, scrape Macomb County foreclosure notices from Legal News, enrich via MyPlus, and import into Lofty as preforeclosure leads.

## Pipeline Stages

```
Legal News scrape → Normalize notices → Enrich in MyPlus → Add disposition → Sync to Lofty → Verify
```

## Stage 1: Scrape Legal News

**Source:** https://www.legalnews.com/County/Notices?location=macomb
**Category:** Foreclosures (on the Macomb county notices page)
**Date window:** Previous Saturday through current Friday

### Required fields per notice

| Field | Source |
|-------|--------|
| PUBLISHED_DATE | Legal News |
| SALE_DATE | Legal News (TBD if absent) |
| county | Macomb |
| notice_type | Foreclosure by Advertisement |
| mortgagor | Legal News |
| address | Legal News |
| attorney | Legal News |
| amount_due | Legal News |
| source_url | Legal News |
| raw_notice_text | Legal News (verbatim) |

### Confidence tiers

- **high** — all required fields present
- **medium** — 1-2 fields missing (e.g., no sale date)
- **review** — needs human verification

### Workflow

1. Navigate to https://www.legalnews.com/County/Notices?location=macomb
2. Click **Foreclosures** bucket
3. Open **Advanced Search**
4. Set published date range: last Saturday → today (Friday)
5. Review each notice
6. Extract required fields
7. Save raw notice text verbatim
8. Save to the intake workflow or CSV staging

## Stage 2: Normalize & Deduplicate

1. Compare against existing Lofty records (search by name + address)
2. If lead already exists → update note/source on existing record
3. If new → create intake record
4. Apply confidence tier

## Stage 3: Enrich via MyPlus

For each lead:

1. Open https://portal.myplusleads.com
2. Search by mortgagor name
3. Augment contact info (phones, emails)
4. Note property address and any additional details
5. Record all phone numbers in order

## Stage 4: Add Disposition + Notice Note

For each lead, create a note with:

```
DISPOSITION: Preforeclosure — Ready for outreach
SOURCE: Legal News — Macomb Foreclosures
PUBLISHED DATE: [date]
SALE DATE: [date]
AMOUNT OWED: [amount]
PROPERTY ADDRESS: [address]
ATTORNEY: [attorney name / firm]
CONFIDENCE: [high/medium/review]

--- RAW NOTICE TEXT ---
[Full verbatim notice from Legal News]
--- END NOTICE ---
```

## Stage 5: Sync to Lofty

### Via MyPlus portal (preferred)

1. In MyPlus, find the lead
2. Click Lofty/Chime integration → Confirm sync
3. Verify "Lofty - Synchronized" in history

### Via CSV import (fallback)

If portal sync fails for some leads:

1. Export as CSV with columns:
   - First Name, Last Name, Phone, Email, Address
   - Tag: PREFORECLOSURE
   - Segment: Preforeclosure
   - Notes: [full notice text]
   - Assigned Agent: Hank Mendez or Harry Kourlos
2. Import in Lofty: Personal Settings → Lead Import
3. Map columns to Lofty fields

## Stage 6: Verify in Lofty

For each imported lead:

1. Search in Lofty by name
2. Confirm: correct name, phone, tags, segment, note, assignment
3. Check pipeline stage is appropriate

## Assignment Rule

- **Odd-numbered leads → Hank Mendez**
- **Even-numbered leads → Harry Kourlos**
- Hank gets the extra lead in odd-sized batches

## Tags & Segments

| Type | Value | Purpose |
|------|-------|---------|
| Tag | PREFORECLOSURE | Searchable classification |
| Segment | Preforeclosure | Pipeline grouping |

A lead can have multiple tags but only one pipeline stage.

## Compliance

- **Preserve raw notice text** — never drop source provenance
- **Human review required** — before any outreach or publishing
- **DNC status** — preserve whenever a phone is present
- **Michigan LARA** — follow state licensing rules for outreach
- **Fair Housing** — no discriminatory language in any outreach

## Cadence

- **Weekly:** Friday 12:00 PM Eastern
- **Source:** Legal News Macomb Foreclosures
- **Batch size:** Typically 15-30 leads per week
- **Expected enrichment time:** 2-4 hours for full batch

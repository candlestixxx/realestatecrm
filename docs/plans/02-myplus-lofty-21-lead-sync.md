# 02 — MyPlus → Lofty: 21-Lead Sync Workflow

## Prerequisites

1. ✅ Lofty API key verified (see `01-lofty-api-setup.md`)
2. ✅ MyPlus portal access: https://portal.myplusleads.com
3. ✅ MyPlus Data Integration shows **Lofty** as authorized, active, Sync Leads = true
4. ✅ Dev server running: `npm run dev` → http://localhost:3000

## The 21 Leads

All from Legal News — Macomb Foreclosures. Currently in sync queue at `data/sync-queue.json`.

| # | Name | Agent | Phone | Status |
|---|------|-------|-------|--------|
| 1 | Danette Colbert | Hank Mendez | Needs enrichment | QUEUED |
| 2 | Leon Phongsavath | Harry Kourlos | Needs enrichment | QUEUED |
| 3 | Ronald J. Legendre | Hank Mendez | Needs enrichment | QUEUED |
| 4 | Ryan R. Amluxen | Harry Kourlos | Needs enrichment | QUEUED |
| 5 | Christian P. Klein | Hank Mendez | Needs enrichment | QUEUED |
| 6 | Yvette Webb | Harry Kourlos | Needs enrichment | QUEUED |
| 7 | Robert C. Hauss 16830 | Hank Mendez | Needs enrichment | QUEUED |
| 8 | Robert C. Hauss 16840 | Harry Kourlos | Needs enrichment | QUEUED |
| 9 | Nicholas J. Rancilio | Hank Mendez | Needs enrichment | QUEUED |
| 10 | Brian Kaseta | Harry Kourlos | Needs enrichment | QUEUED |
| 11 | Anthony Bruce | Hank Mendez | Needs enrichment | QUEUED |
| 12 | Subhan Group Inc | Harry Kourlos | Needs enrichment | QUEUED |
| 13 | Abdul Norwood | Hank Mendez | Needs enrichment | QUEUED |
| 14 | Patti Turner | Harry Kourlos | Needs enrichment | QUEUED |
| 15 | Cadarrell Thomas Mcallister | Hank Mendez | Needs enrichment | QUEUED |
| 16 | Shajbin Begum | Harry Kourlos | Needs enrichment | QUEUED |
| 17 | Anthony Scott | Hank Mendez | Needs enrichment | QUEUED |
| 18 | Brian Bayer | Harry Kourlos | Needs enrichment | QUEUED |
| 19 | Stephen J. Clouse | Hank Mendez | Needs enrichment | QUEUED |
| 20 | Megan A Konop | Harry Kourlos | Needs enrichment | QUEUED |
| 21 | Bradley S. Campbell | Hank Mendez | Needs enrichment | QUEUED |

**Assignment rule:** Odd numbers → Hank Mendez, Even numbers → Harry Kourlos.

## Per-Lead Sync Workflow

For EACH of the 21 leads, complete these steps in order:

### Step 1: Search in MyPlus for contact info

1. Open MyPlus: https://portal.myplusleads.com
2. Search for the lead by name
3. Click into the lead record
4. Note the **phone numbers** (primary + any additional)
5. Note the **email** if present
6. Note the **property address**

### Step 2: Augment phone numbers

1. In MyPlus, click **Enhanced Contact Information** or **Augment**
2. This pulls additional phone numbers and emails from public records
3. Record all phone numbers found

### Step 3: Add disposition + notice note

Before syncing to Lofty, create a note on the lead with:

```
DISPOSITION: Preforeclosure — Ready for outreach
SOURCE: Legal News — Macomb Foreclosures
SALE DATE: [from notice]
AMOUNT OWED: [from notice]
PROPERTY ADDRESS: [from records]
ATTORNEY: [from notice]
PUBLISHED DATE: [from notice]

--- RAW NOTICE TEXT ---
[Full verbatim notice text from Legal News]
--- END NOTICE ---
```

### Step 4: Trigger MyPlus → Lofty sync

1. In the MyPlus lead record, find the **Data Integration** section
2. Click the **Lofty** / **Chime** integration button
3. Confirm the sync
4. Verify you see **"Lofty - Synchronized"** in the integration history

### Step 5: Verify in Lofty

1. Open Lofty: https://app.lofty.com
2. Search for the lead by name
3. Confirm the lead appears with:
   - Correct name
   - Phone number(s) transferred
   - Tags: `PREFORECLOSURE`
   - Segment: `Preforeclosure`
   - Note with foreclosure notice text
   - Assigned agent: Hank Mendez or Harry Kourlos

### Step 6: Mark synced in queue

1. Go to http://localhost:3000/dashboard/sync-queue
2. Find the lead in the queue
3. Click **Mark Synced**
4. Optionally enter the Lofty contact ID
5. The lead moves to SYNCED status

### Step 7: Move to next lead

Click **Start Next Sync** to pop the next queued lead.

## Queue Management

- **Stats bar** shows: Total / Queued / Syncing / Synced / Failed / Skipped
- **Filter tabs** let you view by status
- **Failed leads** are tracked with error messages — do not silently drop
- **Skipped leads** are tracked — come back to them later
- **Portal link** opens MyPlus search pre-filled with the lead name

## What Each Lead Needs Before Lofty Sync

| Field | Source | Required? |
|-------|--------|-----------|
| First/Last name | Legal News | ✅ Yes |
| Phone number(s) | MyPlus augmentation | ✅ Yes (enrich separately) |
| Email | MyPlus augmentation | Nice to have |
| Property address | MyPlus / Legal News | ✅ Yes |
| Sale date | Legal News notice | ✅ Yes |
| Amount owed | Legal News notice | ✅ Yes |
| Attorney | Legal News notice | Nice to have |
| Disposition | Manual | ✅ Yes |
| Notice text | Legal News (verbatim) | ✅ Yes |
| Tag | PREFORECLOSURE | ✅ Yes |
| Segment | Preforeclosure | ✅ Yes |
| Assigned agent | Rotation rule | ✅ Yes |

## Automation Notes

- **Do not batch-sync** — one at a time through MyPlus portal
- **Do not skip phone enrichment** — augment in MyPlus first
- **Preserve notice text verbatim** — compliance requirement
- **Verify each lead landed in Lofty** — do not assume success
- **Portal sessions may expire** — re-authenticate if needed

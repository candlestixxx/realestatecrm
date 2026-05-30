# Macomb County Foreclosure Pipeline — Workflow Map

## Overview
This map describes the weekly Friday Macomb County foreclosure process from public notice to Lofty sync.

## Field map reference
Use `docs/macomb-foreclosure-field-map.md` for the exact source-to-CRM-to-Lofty mapping, parsing rules, tags, and human review gates.

## Trigger
- Scheduled run every Friday between 10:00 AM and 12:00 PM local time
- Optional manual run button for testing or recovery

## Step-by-step workflow

### 1) Start weekly run
- Confirm county = Macomb County
- Compute date window for the weekly notice pull
- Open the notice source

### 2) Pull public notices
- Navigate to the public notices section
- Select the correct date range
- Retrieve the weekly foreclosure notices
- Filter to Macomb County entries
- Capture notice body text, names, legal descriptions, and URLs

### 3) Normalize each lead
For each notice:
- create a lead shell
- parse the address
- parse the mortgagor/owner name
- attach the notice body
- mark as preforeclosure

### 4) Enrich public data
- use approved public-record and enrichment sources
- find phone numbers and contact details when available
- populate available first/last name, address, email, and phone fields
- keep a confidence flag for uncertain matches

### 5) Add notes and tags
- copy the body of the notice into contact notes
- add tag `#PreForeclosure`
- set segment to `PREFORECLOSURE`
- set disposition to `Preforeclosure`

### 6) Assign owner and agent
- split the lead pool evenly between Hank Mendez and Harry Kourlos
- store the assigned agent on the lead
- mark task ownership accordingly

### 7) Create follow-up tasks
- create a call task for the assigned agent
- create a notification/email reminder inside Lofty if supported
- set due date/time based on the business rule

### 8) Sync to Lofty
- push the enriched lead record to Lofty
- map fields consistently
- match phone numbers in the required order
- allow previously synchronized records if required by workflow rules
- capture the destination record ID after sync if possible

### 9) Apply campaign
- assign `ELRT PreForeclosure Campaign`
- confirm the lead is inside the `PREFORECLOSURE` segment
- confirm tag and assignment state

### 10) Finalize
- log success
- log any missing fields or failed lookups
- mark lead as processed
- show summary of how many leads were created, enriched, synced, or skipped

## Branches and exceptions

### If notice results are empty
- stop the run early
- log a no-results message
- notify the operator

### If a source page changes
- pause automation
- surface the failing step
- allow a human to re-run or update selectors

### If a lead cannot be matched
- keep the lead in review
- let the user correct address/name data manually

### If enrichment fails
- save the notice lead without enrichment
- mark enrichment as partial
- queue for later retry

### If Lofty sync fails
- keep the lead in the staging list
- show a retry action
- preserve the source data so nothing is lost

## Recommended screens
### Weekly Run Dashboard
- county selector
- date range display
- run status
- progress bar
- error log
- retry button

### Lead Queue
- sortable table
- filtered by county, city, zip, status, agent
- row actions for review, edit, sync, and task creation

### Lead Detail Drawer
- notice body
- contact fields
- notes
- enrichment history
- sync history
- task panel

### Settings Panel
- county config
- source config
- enrichment config
- CRM mapping
- assignment rules
- campaign mapping

## Minimum viable automated loop
1. Pull public notices.
2. Build lead rows.
3. Enrich contact details.
4. Add notes/tags/segment.
5. Assign agents.
6. Create tasks.
7. Sync to Lofty.
8. Apply campaign.
9. Log results.

## Human-in-the-loop gates
- source selector fails
- ambiguous notice matching
- missing fields that matter for mapping
- sync validation warnings
- manual review requested

## Data outputs
- lead list
- enriched contact records
- task records
- sync status records
- daily/weekly summary

## Long-term extension points
- Oakland County support
- additional counties
- alternate notice sources
- additional CRM destinations
- more enrichment adapters
- bulk reprocessing tools

## Success definition
A Friday run completes with:
- county notices captured
- leads normalized
- enrichment applied where available
- notes and tags added
- assignment split correctly
- tasks created
- Lofty sync completed
- campaign attached
- audit log saved

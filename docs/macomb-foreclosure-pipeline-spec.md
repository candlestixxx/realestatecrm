# Macomb County Foreclosure Pipeline — Build Spec

## Purpose
Build a weekly foreclosure lead pipeline for **Macomb County, Michigan** that starts from public notice sources, enriches leads, organizes them in a CRM-style list view, and syncs to Lofty with tasks, tags, segments, and drip assignment.

## Important compliance note
This system must be built with compliant controls for public records usage, contact outreach, opt-out handling, and data handling. If a workflow touches calling, texting, email, or enrichment, it must support compliance gates and audit logs. The UI can still be simple and fast, but the backend should enforce policy.

## Primary objective
Every Friday, the system should:
1. Pull the weekly Macomb County foreclosure notice list from Legal News.
2. Extract each notice lead.
3. Enrich each lead with public-record/contact data through allowed sources.
4. Organize the leads in a CRM-like list view.
5. Allow notes, tags, tasks, segments, and ownership assignment.
6. Sync the leads to Lofty.
7. Assign the drip campaign and follow-up tasks.

## Scope
### Included
- Weekly Macomb County foreclosure notice intake
- Notice parsing and lead creation
- Address/name matching
- Lead enrichment from approved sources
- List view / spot-holder CRM-like interface
- Notes, tags, segments, disposition, and follow-up tasks
- Export/import to CRM destinations, especially Lofty
- Automation support for browser-based third-party enrichment tools
- Audit trail and retry handling

### Excluded for initial MVP
- Full county coverage outside Macomb County
- Advanced multi-county normalization
- Fully autonomous legal analysis or legal advice
- Any workflow that bypasses platform policy or law

## Core sources
### Notice source
- Legal News public notices for Macomb County
- Weekly Friday pull
- Date window based on the previous Saturday through the current Friday notice cycle

### Enrichment sources
- Public records and county records where allowed
- Approved third-party enrichment sources already in use by the business
- Existing CRM/Lofty data when available
- Optional browser-assisted enrichment flow

## Lead fields to capture
### Required
- First name
- Last name
- Email
- Property address
- All available phone numbers
- Disposition
- Contact notes
- Source notice text
- County
- Notice date
- Public notice URL or record reference
- Assigned agent
- Segment
- Tags

### Optional enrichment fields
- Spouse/related contact references where legally and operationally allowed
- Relative / roommate references where allowed
- Phone labels: landline, mobile, work, other
- Notes on address match confidence
- Lead source confidence
- County parcel / tax record references

## Lead organization requirements
The system should support a list-view CRM layout with:
- sortable columns
- filter by county, city, zip, notice type, stage, owner, assigned rep, segment, tag
- inline note editing
- inline disposition editing
- inline contact-data editing
- task status indicators
- follow-up alert indicators
- import/export buttons

## Required workflow states
- New notice captured
- Parsed
- Address/name matched
- Enrichment in progress
- Enriched
- Ready for review
- Ready for CRM sync
- Synced to Lofty
- Follow-up tasks created
- Campaign assigned
- Archived / completed

## Weekly automation schedule
- Run every Friday
- Preferred window: 10:00 AM to 12:00 PM local time
- Default county: Macomb County
- Future extension: Oakland County and other counties

## Workflow overview
1. Open Legal News public notices.
2. Select the correct date range.
3. Pull the Macomb County foreclosure notices.
4. Normalize each lead into a structured row.
5. Match the property address and/or name.
6. Enrich the lead with approved data sources.
7. Add notes from the notice body.
8. Set disposition to Preforeclosure.
9. Apply the `#PreForeclosure` tag.
10. Add the lead to the `PREFORECLOSURE` segment.
11. Assign evenly between Hank Mendez and Harry Kourlos.
12. Create a follow-up task to call the lead.
13. Sync to Lofty.
14. Assign the `ELRT PreForeclosure Campaign` drip campaign.
15. Log completion and any exceptions.

## Distribution logic
- Leads should be split as evenly as possible between Hank Mendez and Harry Kourlos.
- If the count is odd, the extra lead should follow a deterministic tie-break rule.
- Ownership assignment should be recorded before sync.

## Tasks and alerts
Each lead should include:
- a call task
- an email or internal notification task to the assigned agent
- a follow-up reminder date/time
- a status flag if the task is overdue or completed

## Tags / segments
- Tag: `#PreForeclosure`
- Segment: `PREFORECLOSURE`
- Optional list labels for city, zip, notice type, or source county

## CRM integration requirements
The system should be able to:
- push leads to Lofty
- pull back synced IDs or status when possible
- allow export to CSV or another CRM format if needed later
- remain usable as a standalone tool if CRM sync is temporarily unavailable

## Browser-automation requirements
If the workflow uses browser tools:
- keep each website interaction isolated and repeatable
- handle login/session failures cleanly
- support retries for missing selectors or page-load issues
- allow a human to step in for captcha or unusual page changes

## Data model outline
Use `docs/macomb-foreclosure-field-map.md` as the canonical source-to-CRM mapping reference for all fields below.

### ForeclosureNotice
- id
- county
- source
- public notice date
- publication date
- notice text
- source url
- legal description
- raw page reference

### ForeclosureLead
- id
- first name
- last name
- address
- city
- state
- zip
- phones
- email
- notes
- disposition
- tags
- segment
- assigned agent
- status
- enrichment state
- sync state

### EnrichmentRecord
- id
- lead id
- source
- fields returned
- confidence
- timestamp
- notes

### SyncJob
- id
- lead ids
- destination CRM
- status
- error message
- retry count
- timestamps

### TaskRecord
- id
- lead id
- owner
- due date
- type
- status
- notification channel

## UI requirements
### Dashboard
- weekly queue view
- county selector
- date window selector
- status chips
- sync progress
- error indicators

### Lead list view
- table/grid with filters and search
- inline edit
- row actions
- bulk actions
- task and campaign status

### Lead detail view
- notice text
- contact data
- public record references
- notes
- task timeline
- CRM sync status
- assignment controls

### Settings / admin
- county configs
- source configs
- field mappings
- segment/tag rules
- assignment rules
- workflow schedule
- destination CRM mapping

## Automation engine behavior
- Support a fully automatic mode for the weekly run.
- Support a human-assisted mode when source pages change or a selector fails.
- Support manual-only mode for review and cleanup.
- Log every step and state transition.

## Error handling
The system must gracefully handle:
- empty notice results
- unexpected page layout changes
- failed enrichment lookups
- duplicate leads
- missing address matches
- sync failures to Lofty
- partial lead records
- null/empty results from a source

## Nonfunctional requirements
- TypeScript-first implementation
- clean audit logs
- resilient retries
- fast list view
- mobile-friendly review screens
- secure handling of credentials
- no secrets committed to source control

## Acceptance criteria
- Macomb County Friday notices can be processed reliably.
- Leads are created and enriched consistently.
- Notes, tags, segments, and tasks are populated.
- Leads sync to Lofty with correct assignment and campaign settings.
- The system can operate on its own or alongside another CRM.
- The UI is clear enough for weekly production use.

## What I still need from you to implement
- Exact source URLs and page flow details for each site
- The preferred destination CRM field mapping in Lofty
- The exact task/reminder timing rules
- The tie-break rule for odd lead counts
- Any allowed enrichment source list in priority order
- Whether you want a human approval gate before sync or full auto-sync
- A sample exported lead record from Lofty if available

## Implementation recommendation
Build this as a modular pipeline with:
- a notice ingestion module
- a lead normalization module
- an enrichment adapter module
- a CRM sync adapter module
- a task/campaign assignment module
- a review dashboard
- a retry/error log

## Deliverable goal
The result should be a universal foreclosure lead tool that can:
- run standalone
- integrate with Lofty
- integrate with other CRMs later
- support future county expansion without rewriting the core pipeline

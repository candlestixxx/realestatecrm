# Repo Consolidation Analysis

> Generated from deep analysis of all 9 repos (2026-09-22)
> **Status:** Phase A (Voice merge) and Phase B (Content merge) COMPLETE
> See `IDEAS_PRESERVATION.md` for every idea/concept preserved across merges.

## Architecture Decision: Git Submodules

All sub-projects live under `apps/` as git submodules of `realestatecrm`.
Each retains its own independent git history and GitHub repo.
`push-all.ps1` pushes everything simultaneously.

```
realestatecrm/                    ← main umbrella repo
├── src/                          ← main CRM dashboard ("Excel Legacy")
├── apps/
│   ├── foreclosureworkflow/      ← forclosureworkflow (specialized vertical)
│   ├── aicrm/                    ← aicrm (features to port to main)
│   ├── leadcaller/               ← realestateleadcaller (⚠ DEPRECATED — merged into leadg)
│   ├── leadg/                    ← leadG (✅ MERGED: voice-agent = leadG + leadcaller)
│   ├── contentplanner/           ← socialmediacontentplanner (✅ MERGED: content-studio = contentplanner + prototype)
│   ├── media-workflow/           ← re-agent-workflow-media-1 (unique pipeline)
│   ├── prototype/                ← realestateprototype (⚠ DEPRECATED — merged into contentplanner)
│   └── legacyleads/              ← LegacyLeads (unique data platform)
├── push-all.ps1                  ← push main + all submodules
├── IDEAS_PRESERVATION.md         ← every unique idea from every repo
└── CONSOLIDATION.md              ← this file
```

---

## Overlap Analysis

### Group 1: CRM Core (4 projects with heavy overlap)

| Feature | realestatecrm | aicrm | foreclosureworkflow | leadcaller |
|---|:---:|:---:|:---:|:---:|
| Lead CRUD | ✅ | ✅ | ✅ | ✅ |
| Contact Management | ✅ | ✅ | ✅ | ✅ |
| Tasks / Activities | ✅ | ✅ | ✅ | ✅ |
| Campaigns / Drip | ✅ | ✅ | ✅ | ✅ |
| Pipeline / Kanban | ✅ | ✅ | | |
| Lead Scoring | | ✅ | ✅ | ✅ |
| Tags / Segments | ✅ | ✅ | ✅ | |
| Auth / RBAC | ✅ | ✅ | ✅ | ✅ |
| CSV Import/Export | ✅ | ✅ | ✅ | ✅ |
| Search / Filters | ✅ | ✅ | ✅ | ✅ |
| Notes | ✅ | ✅ | ✅ | ✅ |
| Notifications | ✅ | | ✅ | ✅ |

**Verdict:** All four are full CRUD CRM apps. The main `realestatecrm` is the most
complete (Next.js 16, Prisma, NextAuth, workspaces, multi-tenant roles). `aicrm`
adds MCP integration + workflow automation. `foreclosureworkflow` is a specialized
vertical for foreclosure leads. `leadcaller` is CRM + voice calling.

**Recommendation:** These four should be **consolidated over time**. The main
`realestatecrm` should absorb the generic CRM features from `aicrm` (MCP, workflow
engine, multi-model LLM routing). `foreclosureworkflow` stays as a specialized
sub-module (its foreclosure-specific pipeline is unique). `leadcaller`'s CRM parts
fold into main; its voice/calling parts merge with `leadg` (see Group 2).

---

### Group 2: Voice / AI Calling (2 projects nearly identical!)

| Feature | leadG (VoiceForge AI) | realestateleadcaller (Jules) |
|---|:---:|:---:|
| Twilio Voice | ✅ | ✅ |
| AI Conversation Engine | ✅ (GPT-4o) | ✅ (OpenAI) |
| Warm Transfers | ✅ | ✅ |
| Multi-Channel (Call/SMS/Email) | ✅ | ✅ |
| Call Logging | ✅ | ✅ |
| Campaign Sequences | ✅ (BullMQ) | ✅ (State Machine) |
| CRM Webhook Ingestion | ✅ | ✅ |
| Lead Qualification/Scoring | ✅ | ✅ |
| Direct Mail | | ✅ |
| Stripe Billing | ✅ | |
| WebRTC Live Monitoring | ✅ | ✅ |
| Objection Handling / Reflection | ✅ | |

**Verdict:** These are **the same product built twice**. Both are "AI voice SDR
that calls real estate leads, qualifies them, and warm-transfers to humans."
`leadG` is more mature (BullMQ queues, Stripe billing, reflection engine).
`realestateleadcaller` has direct mail + calendar scheduling.

**Recommendation:** **MERGE into one project** (use `leadG` as the base).
Port `realestateleadcaller`'s unique features: direct mail dispatch, calendar
scheduling, the state-machine workflow engine, and the "Jules" persona/branding.

---

### Group 3: Social Media / Content (2 projects nearly identical!)

| Feature | socialmediacontentplanner | realestateprototype |
|---|:---:|:---:|
| AI Content Generation | ✅ | ✅ |
| Multi-Platform Social | ✅ | ✅ |
| Content Calendar | ✅ | ✅ |
| Campaign Scheduling | ✅ | ✅ |
| Analytics Dashboard | ✅ | ✅ |
| Video Studio | ✅ | |
| Podcast Studio | ✅ | |
| Landing Page Builder | ✅ | |
| RAG (Scraping Context) | ✅ | |
| Brand Kits | ✅ | |
| Stripe Billing | ✅ | |
| Mobile App (React Native) | ✅ | |
| Business-Type Switching | | ✅ |
| Next.js Migration | ✅ | ✅ (in progress) |

**Verdict:** Both are "AI-powered social media content planner + scheduler."
`socialmediacontentplanner` (ContentCommand AI) is far more complete (22+ phases
done, mobile app, billing, RAG, multi-platform OAuth). `realestateprototype`
(Legacy One) pivoted to "universal business" but is less advanced.

**Recommendation:** **MERGE into one project** (use `socialmediacontentplanner`
as the base). Port `realestateprototype`'s unique feature: business-type
switching (universal industry config). The prototype can then be archived.

---

### Group 4: Marketing Media Pipeline (1 project — no duplicate)

`re-agent-workflow-media-1` is unique: Magnific AI → Canva → Lofty → Social
publishing pipeline. The main CRM's `docs/plans/04-marketing-pipeline.md`
documents the same pipeline. This sub-project is the **implementation** of that
document.

**Recommendation:** Keep as a focused sub-module. Consider porting its logic
into the main CRM's `src/lib/media-pipeline/` over time (which already has
partial implementations).

---

### Group 5: Lead Data Platform (1 project — no duplicate)

`LegacyLeads` (OmniLead Nexus) is unique: MLS data ingestion (RESO API),
skip-tracing cascade, credit/billing ledger, geospatial queries. This is
infrastructure that other projects can consume via API.

**Recommendation:** Keep as independent sub-module. It's a data service layer
that feeds leads into the CRM and calling platforms.

---

## Consolidation Roadmap

### Phase A: Merge Voice Projects ✅ COMPLETE (2026-09-22)
1. ✅ Used `leadG` as the base for the merged voice/calling platform
2. ✅ Ported from `realestateleadcaller`: direct mail, calendar, state-machine workflows,
   knowledge base, sentiment analyzer, maps/geocoding, WebRTC dialer, MCP server,
   workflow builder, notification system, AI scripts
3. ✅ 49 files, 5,043 lines of code ported
4. ✅ MERGE_GUIDE.md documents all integration points
5. ⏳ Deprecate `realestateleadcaller` repo (after verification)

### Phase B: Merge Content Projects ✅ COMPLETE (2026-09-22)
1. ✅ Used `socialmediacontentplanner` as the base
2. ✅ Ported from `realestateprototype`: universal business-type config,
   AI persona/brand voice, Canva integration, drag-to-select calendar,
   draft review flow, content library filters
3. ✅ 14 files, 1,195 lines of code ported
4. ✅ MERGE_GUIDE.md documents all integration points
5. ⏳ Deprecate `realestateprototype` repo (after verification)

### Phase C: Consolidate CRM Features into Main ⏳ NEXT
1. Port from `aicrm`: MCP server, NL command engine, workflow engine,
   multi-model LLM router, secure API vault, approval queue, vector embeddings
2. Keep `foreclosureworkflow` as specialized vertical
3. Deprecate `aicrm` repo after merge

### Phase D: Integrate Media Pipeline ⏳ FUTURE
1. Evaluate merging `re-agent-workflow-media-1` into main CRM's
   `src/lib/media-pipeline/`
2. Keep as sub-module if it needs to run independently

### Final Target Structure
```
realestatecrm/                    ← single main CRM (absorbed aicrm features)
├── apps/
│   ├── voice-agent/              ← leadG (merged voice + concierge) ✅
│   ├── content-studio/           ← contentplanner (merged content + universal) ✅
│   ├── foreclosure/              ← specialized foreclosure vertical
│   ├── media-pipeline/           ← marketing media automation
│   └── data-platform/            ← LegacyLeads (MLS/skip-trace service)
```

---

## Feature Branch Merge Summary (2026-09-22)

All feature branches merged into `main` and pushed:

| Repo | Branch | Commits | Status |
|---|---|---|---|
| aicrm | jules-3434254056450392757 | 4 (Phases 2-5) | ✅ Merged + pushed |
| forclosureworkflow | feat/s3-document-upload | 1 (S3 uploads, voice monitoring, data quality) | ✅ Merged + pushed |
| re-agent-workflow-media-1 | jules-10626851319290360880 | 1 (Phase 14: AI Agent Approvals) | ✅ Merged + pushed |
| realestateleadcaller | jules-2713423736642792031 | 1 (docs + version) | ✅ Merged + pushed |
| realestateprototype | jules-588126708554458831 | 6 (Next.js 14 migration) | ✅ Merged + pushed |
| socialmediacontentplanner | jules-6504094641305471454 | 1 (chore) | ✅ Merged + pushed |
| leadG | (all merged) | 0 | ✅ Already clean |
| LegacyLeads | (all merged) | 0 | ✅ Already clean |


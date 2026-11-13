# RealEstateCRM

A CRM and business operating system for **Excel Legacy Realty Group**:
lead management, a pre-foreclosure pipeline, marketing automation, content
publishing, voice AI, and deal workflows in one Next.js dashboard.

## Status

**Under very active development — v0.63.4** (2026-11-12). Built for one
brokerage; not a general product yet. A foreclosure-pipeline demo for the
brokerage is scheduled **2026-11-13**, as a CRM-side walkthrough with local
and seeded data (not a live production run).

Production deploy of the 0.63.x line is held until after the demo. There are
no paying customers yet — the pilot terms ($500 setup + $500/mo) have been
written up but the brokerage has not agreed to them.

## What's working

- **Foreclosure parser tests (Gate 1, closed 2026-11-12):** 47 parser tests
  pass, including weekly Macomb intake and Legal News parsers; the parser CI
  job passes on GitHub.
- **Root test suite:** 40/40 tests pass locally (v0.63.1); all lint errors
  cleared in v0.63.4.
- **Seeded demo data:** a demo workspace (Excel Legacy Realty Group) with
  users, contacts, leads, deals, SmartPlan templates, and routing rules.
- Lead pipeline (kanban), Smart Plans (drip campaigns), AgentCore AI console,
  workflow builder, unified inbox, publishing calendar — implemented to
  varying degrees of completeness.

## What's not / known gaps

- **Five API routes return explicit "unconfigured" / 503 responses when
  their keys are missing** (skip-trace enrichment, property-data, avatar,
  live-MLS, and the agent handshake) — they no longer fabricate mock data,
  but they are not wired to real data either. Lofty sync and paid feeds are
  Phase 2, explicitly out of demo scope.
- **E2E tests are not wired into CI.**
- **`ignoreBuildErrors` stays on, with justification:** ~173 TypeScript
  errors (~165 real). Removing it is a cleanup project, not demo prep.
- The Hermes agent sessions that feed the pipeline live on a collaborator's
  machine; the verification report from that machine is still outstanding,
  and the brokerage login for live-listing pulls has not been provided.
- Real API keys are unwired; production deploy is undone.

## Architecture

This repo is the **main dashboard** and single entry point. Sub-projects live
as git submodules under `apps/` and appear as subpages in the dashboard
(8 submodules as of the 2026-11-12 org transfer to RealEstateCRMLLC,
including the newly added `aicrm`, `leadcaller`, and `prototype`):

| Submodule | Purpose |
|-----------|---------|
| `apps/leadg` | Lead generation & AI outreach |
| `apps/contentplanner` | Social content planning & publishing |
| `apps/foreclosureworkflow` | Pre-foreclosure pipeline automation |
| `apps/media-workflow` | Media production & asset management |
| `apps/legacyleads` | Legacy lead data migration & archive |
| `apps/aicrm`, `apps/leadcaller`, `apps/prototype` | New in v0.63.1–v0.63.2 |

### AgentCore

The orchestration layer inside this CRM provides: AI console, workflow
builder, vault (API key/secret management), lead routing, AI qualification
(HOT/WARM/COLD), voice AI (ElevenLabs / OpenAI TTS), unified inbox, and a
publishing calendar.

## Tech stack

- **Frontend:** Next.js 16 (App Router) + Tailwind CSS + shadcn/ui
- **Backend:** Next.js API routes
- **Database:** SQLite via Prisma ORM
- **Auth:** NextAuth.js
- **AI:** DeepSeek V4 (chat & completions); OpenAI retained for embeddings
  (RAG) + TTS/STT voice
- **Queues:** BullMQ (Redis)
- **Vector search:** Pinecone / LanceDB

## Getting started

```bash
# 1. Clone with submodules
git clone --recurse-submodules https://github.com/RealEstateCRMLLC/RealEstateCRM.git
cd RealEstateCRM

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env   # database URL, NextAuth secret, API keys

# 4. Set up database
npx prisma generate && npx prisma db push && npx prisma db seed

# 5. Start development server
npm run dev            # http://localhost:3000
```

`npx prisma db seed` creates the demo workspace: 1 workspace, 4 users, 11
contacts, 10 leads, 2 deals, 8 activities, 5 SmartPlan templates, 2
AgentWorkflows, 2 LeadRoutingRules.

## Last significant activity

- **2026-11-12** — v0.63.4 (all lint errors cleared); v0.63.3 (foreclosure
  parser CI job + build matrix); v0.63.2 (aicrm/leadcaller/prototype wired
  into launchers); v0.63.1 (org transfer from candlestixxx to
  RealEstateCRMLLC, 8 submodules); Gate 1 merged — 47 foreclosure parser
  tests, CI job passing.
- **2026-11-07** — CRM presented to the brokerage; no fee agreed at that time.

## Links

- Org: https://github.com/RealEstateCRMLLC
- Docs: `VISION.md`, `ROADMAP.md`, `DEPLOY.md`, `HANDOFF.md`, `VERSION.md`

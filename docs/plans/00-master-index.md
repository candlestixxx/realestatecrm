# Excel Legacy Realty CRM — Master Documentation Index

> **For Hermes or any agent:** Read files in order. Each file is self-contained.
> Do not skip files — later ones reference earlier ones.

**Project:** RealEstateCRM (Next.js 16 + TypeScript + Prisma/Postgres)
**Brand:** Excel Legacy Realty Team (black/blue/gold luxury aesthetic)
**Location:** Michigan (LARA, MCL 339.2512e, Fair Housing)
**Version:** 0.41.0

---

## Document Pack

| # | File | Purpose |
|---|------|---------|
| 00 | `00-master-index.md` | This file — read first |
| 01 | `01-lofty-api-setup.md` | Lofty API key setup, auth format, testing |
| 02 | `02-myplus-lofty-21-lead-sync.md` | Step-by-step: augment 21 leads, sync to Lofty |
| 03 | `03-foreclosure-intake-pipeline.md` | Legal News → enrichment → CRM import workflow |
| 04 | `04-marketing-pipeline.md` | Listing media: Magnific → Canva → Lofty → Social |
| 05 | `05-crm-architecture.md` | System architecture, integrations, role hierarchy |
| 06 | `06-deployment-checklist.md` | Staging/production readiness |
| 07 | `07-known-issues-and-fixes.md` | Bugs, workarounds, pitfalls discovered |

## Quick Start

1. **Read `01-lofty-api-setup.md` first** — fix the API key, verify it works
2. **Read `02-myplus-lofty-21-lead-sync.md`** — run the 21-lead sync
3. **Read `03-foreclosure-intake-pipeline.md`** — understand the weekly intake
4. **Read `04-marketing-pipeline.md`** — understand the media pipeline
5. **Read `05-crm-architecture.md`** — understand the full system
6. **Read `06-deployment-checklist.md`** — before going live
7. **Read `07-known-issues-and-fixes.md`** — if something breaks

## User Preferences

- **UI:** Dark luxury (black background, blue/gold accents), light mode toggle
- **Branding:** Excel Legacy Realty Team logo colors
- **Workflows:** Workflow-native (no Make.com), visible Add Workflow/Add Step
- **Compliance:** Michigan LARA, Fair Housing, human review before MLS/portal
- **Agents:** Hank Mendez (odd leads), Harry Kourlos (even leads)
- **Phone:** Do not block imports on missing phones — enrich separately
- **Documentation:** VERSION.md, CHANGELOG.md, TODO.md, HANDOFF.md

## Architecture Stack

- **Frontend:** Next.js 16 App Router, React, Tailwind CSS
- **Backend:** Next.js API routes, TypeScript
- **Database:** Prisma ORM + PostgreSQL (file-backed fallback for dev)
- **Auth:** NextAuth credentials, SessionProvider, middleware protection
- **CRM:** Lofty (Chime) — primary CRM, API v1.0
- **Lead Provider:** MyPlus Leads — portal with native Lofty integration
- **Vector/RAG:** OpenAI embeddings + Pinecone (local fallback)
- **Marketing:** Magnific (AI images), Canva (design polish), Lofty (landing pages)
- **Social:** Facebook, LinkedIn, Instagram (manual publish)

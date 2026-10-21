# TODO.md

## Short-Term Tasks & Backlog

### Documentation & Standards
- [x] Create universal and model-specific agent documentation.
- [x] Create project tracking docs (VISION, MEMORY, DEPLOY, etc.).
- [x] Create `docs/LIBRARIES.md` documenting submodules and versions.

### CRM Core & UI
- [x] Initialize TypeScript repository scaffold.
- [x] Set up linting, formatting, and CI/CD pipelines.
- [x] Implement foundational UI theme (black/blue/gold luxury identity).
- [x] Scaffold authentication and role-based access control (RBAC).
- [x] Scaffold dashboard and CRM core entities (Prisma).
- [x] Scaffold Leads and Deals UI.
- [x] Wire up dashboard UI with actual database data (Prisma).
- [x] Create mock seed data script.
- [x] Implement Add Lead and New Deal forms and server actions.
- [x] Integrate NextAuth session context and protect dashboard routes.
- [x] Implement Tasks view and AddTask modal.
- [x] Data Validation: Implement Zod schema validation for all Server Actions.
- [x] UI Polish: Add loading states and Toast notifications.
- [x] Feature Expansion: Filtering, sorting, and pagination across all data tables.
- [x] Feature Expansion: Task deadlines and assignment.
- [x] UI Polish: Add comprehensive tooltips, labels, and descriptions to all CRM views and forms.
- [x] Global Search: Implement a Command Palette (`cmdk`) for cross-entity searching.
- [x] Multi-phone and email support with custom categorization labels (Cell, Home, Work, etc.) and primary auto-selection.
- [x] Optimize MyPlusLeads cron sync to run periodically (hourly check and high-frequency morning window).


### Workflow Engine
- [x] Workflow Session model and backend persistence.
- [x] Integrate workflows into Deal details.
- [x] Convert workflows to persistent backend-driven interfaces.

### Client Portal
- [x] Client Portal Routing and layout.
- [x] Portal Home showing assigned Deals and Workflows.
- [x] Client Portal Magic Links (Email Auth).

### AI & RAG
- [x] Global AI Chat component (`AIChat.tsx`).
- [x] AI API Route with streaming.
- [x] Vector Sync Wiring (Prisma -> Vector DB).
- [x] Semantic Retrieval (RAG context injection).
- [x] Workspace-aware RAG sync.
- [x] RAG Consolidation: Refactor overlapping logic in `src/lib/rag.ts` and `src/lib/rag-sync.ts`.
- [x] **AI Tool Calling:** Integrate `@ai-sdk/react` function calling to execute CRM actions (Lead routing, Task creation, Segments management).
- [x] **AI Drip Execution:** Connect Twilio/SendGrid for automated SMS/Email dispatching led by Gemini.

## Tech Debt & Improvements
- [x] Evaluate Drizzle ORM for edge compatibility (See docs/DRIZZLE_EVALUATION.md).
- [x] Robust port conflict handling for Playwright tests.
- [x] Implement WebSocket/WebRTC for real-time chat and voice.

## 0.39.0 Backlog Adjustments
- [x] Fix Next.js 15 `searchParams` unwrap issue on the signin page.
- [x] Implement Activity Type selector (`NOTE`, `CALL`, `EMAIL`, `SMS`, `MEETING`) in `AddActivityForm`.

### Multi-Tenant Websites & Marketing
- [x] Scaffold `/(websites)` route group or secondary Next.js app for multi-tenant handling.
- [x] Build RESO Web API data sync cron job/webhook listener.
- [x] Configure `LandingPage` model to support full domain mapping / custom domains.
- [x] Build intent-triggered Lead Capture Modals (e.g., triggered on photo views).
- [x] Develop embeddable LLM-powered Chat Widget for agent sites.
- [x] Build RESO Web API data sync cron job/webhook listener.
- [x] Configure `LandingPage` model to support full domain mapping / custom domains.
- [x] Build intent-triggered Lead Capture Modals (e.g., triggered on photo views).
- [x] Set up GTM / GA4 injection for dynamically provisioned sites.
- [x] Develop Server-Side tracking pipelines for Google Ads and Facebook CAPI.
- [x] Implement headless CMS adapter for Agent Blogs.
- [x] Migrate local vector synchronization fallback to a hosted Pinecone database before production launch.
- [x] Hosted Vector Migration completed. Pinecone auto-detection is active via env vars (`PINECONE_API_KEY`).


## 2026-10-01 Sync (v0.53.0)

### Repository Synchronization
- [x] Fetch all remotes + tags across root and submodules
- [x] Verify upstream fork parent (none — repo is not a fork)
- [x] Recursive submodule init/update to pinned tracking commits
- [x] Forward-merge audit: all feature branches already fully merged (0 unique commits)
- [x] Reverse-merge: 14 stale feature branches fast-forwarded to main and pushed
- [x] Version sync 0.47.0 → 0.53.0 across VERSION.md / package.json / package-lock.json / CHANGELOG.md
- [x] Un-ignore databases (dev.db, prisma/dev.db, metamcp.db, data/, audit*.jsonl) per retention policy
- [x] Regenerate submodule structural map in docs/LIBRARIES.md
- [x] Update ROADMAP.md with completed Phase 2-12 features

### Remaining
- [x] Private and group chat
- [x] Learning and memory controls
- [x] SEO / Schema.org / Dynamic Sitemap
- [x] Social Media Open Graph + share widgets
- [x] Load testing (scripts/load-test.js — 350/350 pass, p95 < 170ms)
- [ ] Wire real API keys (Stripe, Twilio, SendGrid, Mapbox, BS&A, HubSpot, Salesforce)
- [x] E2E integration tests (scripts/e2e-smoke.js — 21 checks)
- [ ] Production deploy (see DEPLOY.md)

## Repository Sync Tasks (v0.55.0)
- [x] Fetch all remotes and tags
- [x] Sync all submodules to latest origin/main
- [x] Analyze all feature branches for unique content
- [x] Reverse-merge main into all feature branches
- [x] Push all feature branches
- [x] Version bump + changelog
- [x] Generate submodule structural map
- [ ] Wire real API keys (Stripe, Twilio, SendGrid, Mapbox, BS&A, Magnific, HubSpot, Salesforce)
- [x] Run E2E integration tests
- [ ] Production deployment
- [ ] Archive deprecated GitHub repos (aicrm, realestateleadcaller, realestateprototype)
- [x] Load testing

### Dashboard & UI (2026-06-10)
- [x] CommandCenter unified single-page dashboard with value-ordered sections
- [x] Tooltips on all feature cards and section headers
- [x] Workflow wizard pages linked (listing-entry, offer-draft)
- [x] Script reorganization (nondestructive archive)
- [x] Move /workflows/* pages under /dashboard/ routes for consistent navigation
- [x] Test system tray against live running services (fixed foreclosure env vars)
- [x] CI builds for all submodules
- [x] Cross-service API integration (contentplanner/legacyleads to main CRM)
- [x] Live audio WebSocket monitor UI panel in dashboard

### Bug Fixes Found & Applied (2026-06-10)
- [x] Template literal bug in CommandCenter stats fetch (single quotes)
- [x] Template literal bug in reporting/page.tsx and reporting/analytics/page.tsx
- [x] System tray foreclosure missing NEXTAUTH_SECRET/PORT env vars
- [x] Foreclosure url.parse() deprecation (WHATWG URL API)
- [x] Stale submodule gitlinks (aicrm, leadcaller, prototype) from remote merges
- [ ] Redis/Memurai installation for media-workflow MessageBroker
- [x] CI/CD pipeline for automated builds and testing

### Bug Fixes Found & Applied (2026-10-06, v0.57.9)
- [x] FK validation on `deal-stakeholders` POST (dealId → 404)
- [x] FK validation on `deal-requirements` POST (dealId → 404)
- [x] FK validation on `search-alerts` POST (leadId → 404)
- [x] P2025 guard + FK validation on `workflow-sessions` POST (update + workspaceId/userId/leadId/dealId)
- [x] Malformed JSON guard on `ai/memory-settings` POST
- [x] FK validation on `voice-settings` PUT (workspaceId → 404)
- [x] FK validation + P2025 guard on `websites` POST/PATCH
- [x] Partner field names in `partner-permissions` GET (companyName/contactName not name/company)
- [x] Avatar speak validation (text required → 400 not 500)

### UI Condensation (2026-10-06, v0.58.0)
- [x] Condensed `marketing/text-codes` into `/dashboard/marketing` (extracted `TextCodes` component)
- [x] Condensed `websites/builder` into `/dashboard/websites` (extracted `WebsiteBuilder` component)
- [x] Subpages redirect to parent for bookmarks
- [x] Settings already tabbed (6 domains via `SettingsTabs`)
- [x] `reporting/analytics` already redirects to `reporting`
- [x] Workflows subpages are redirect wrappers to `/workflows/*`
- [x] CommandPalette 10 quick-navigation shortcuts (Cmd+K)

### Bug Fixes Found & Applied (2026-10-06)
- [x] Template literal bug in data-quality/page.tsx (single-quoted fetch URL)
- [x] Template literal bug in leaderboard/page.tsx (single-quoted fetch URL)
- [x] Template literal bug in websites/builder/page.tsx (single-quoted fetch URL)
- [x] Help Center expanded from 4 to 10 topics covering all major features
- [x] Analytics Studio consolidated into Reporting (unified tab)
- [x] Full codebase scan for template literal bugs — 0 remaining
- [x] Dashboard layout `requireWorkspaceAccess` uncaught — wrapped in try/catch (root cause of 404s)
- [x] Added marketing/page.tsx + websites/page.tsx parent hub pages (sidebar links resolved)
- [x] Added 28 error.tsx + loading.tsx files for 14 dashboard directories missing them
- [x] AICRM contacts list page (search, quick-create, detail navigation)
- [x] MediaWorkflow webhook/crm graceful degradation (202 when Redis unavailable)
- [x] Pagination param clamping for 7 routes (page/limit/offset bounds)
- [x] P2025 update→404 pattern for 6 CRUD handlers (listings/offers/partners/referrals/webhooks/leads)
- [x] FK validation for child records (notes/relatives/tasks/documents/tags/properties/tasks)
- [x] 94/94 UI pages GREEN across all 6 services
- [x] 8 new dashboard pages (vault/contracts/chat/client-portal/imports/avatar/canva/objections/property-data)
- [x] CommandCenter: 10 new feature cards with tooltips
- [x] 103/103 UI pages GREEN across all 6 services

### Remaining Known Issues
- [ ] Redis/Memurai for media-workflow (gracefully degrades without it)
- [ ] Wire real API keys (Stripe, Twilio, SendGrid, Mapbox, etc.)
- [ ] Archive deprecated GitHub repos (manual GitHub UI action)
- [x] Multi-channel A/B testing in leadG (email/SMS variants) — wired 2026-10-06
- [x] CI/CD pipeline for automated builds and testing
- [x] Live audio WebSocket monitor UI panel in dashboard

### Repository Sync (2026-10-09, v0.58.43)
- [x] Fetch all remotes + tags (root + 5 submodules; no nested submodules)
- [x] Fast-forward submodule mains to origin/main (foreclosureworkflow +2, legacyleads +1, media-workflow +3)
- [x] leadg gitlink advanced 2 commits to origin/main (1e14cca)
- [x] Verified all 10 feature branches fully merged (zero unique commits) — no cherry-pick needed
- [x] Commit submodule launchers (start-3002, start-3004) + gitignore transient logs
- [x] Fix start-all.ps1 media-workflow path (dist/index.js → dist/src/index.js)
- [x] Version bump → 0.58.43 (VERSION.md / package.json / package-lock.json / CHANGELOG)
- [x] Regenerate docs/SUBMODULE_MAP.md + docs/LIBRARIES.md

### Follow-ups for next session
- [x] Decide on uncommitted submodule dependency bumps (lucide-react ^1.16→^1.52 in foreclosureworkflow; lucide-react ^1.25→^1.52 + @next/swc-win32-x64-msvc in legacyleads/frontend) — committed v0.58.45
- [x] Archive the 10 redundant remote feature branches (fast-forwarded to origin/main v0.58.46)
- [ ] Wire real API keys (Stripe, Twilio, SendGrid, Mapbox, etc.)

### Production Deploy (2026-10-16/17, v0.58.50)
- [x] Deploy realestatecrm to Hetzner as `excellegacyrealtygroup.site` (HTTPS + SSL)
- [x] Domain rebrand (13 files)
- [x] Auth working on prod (CredentialsProvider)
- [x] Fix 5 missing React hook imports (useState/useEffect/useRef)
- [x] Create `/api/posts` route (was 404)
- [x] Fix `/api/contracts` payload normalization (was 400)
- [x] Fix `/api/chat/rooms` error handling (was 500)
- [x] Fix posts route to use existing Prisma model
- [x] Create missing ChatRoom/ChatParticipant/ChatMessage tables in SQLite
- [x] Fix DATABASE_URL path (was ./dev.db, now prisma/dev.db)
- [x] LeadG standalone output fix in system-tray.ps1 + start-all.bat
- [x] All 4 bug-fix endpoints verified on prod (200)
- [x] Tooltip markers added to remaining dashboard pages
- [x] Loading + error states verified on all 51 pages

### Remaining Production Gaps
- [ ] Wire real API keys (Stripe, Twilio, SendGrid, Mapbox, etc.)
- [ ] Deploy 8 sub-services to Hetzner
- [ ] Google Maps API key (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)
- [ ] HubSpot OAuth for `/api/lead-gen/social`
- [ ] Legacyleads `/listings` mock data to real data
- [ ] Redis/Memurai for media-workflow MessageBroker

### Repository Sync (2026-10-17, v0.58.51)
- [x] Fetch all remotes + tags (root + 5 submodules; no nested submodules)
- [x] Upstream robertpelloni/realestatecrm == origin/main (6d6d1f3) — no merge needed
- [x] All 5 submodules verified at origin/main with clean working trees
- [x] All 10 feature branches re-verified fully merged (zero unique commits) — no cherry-pick needed
- [x] Reconciled start-all.ps1 to canonical 9-service list (ContentPlanner API 3031 + standalone server paths)
- [x] Version bump → 0.58.51 (fixed package.json/package-lock drift from 0.58.43)
- [x] Regenerate docs/SUBMODULE_MAP.md + docs/LIBRARIES.md

### Follow-ups for next session
- [ ] Delete 10 redundant remote feature branches (manual: `git push origin --delete <branch>`)
- [ ] Wire real API keys (Stripe, Twilio, SendGrid, Mapbox, etc.)
- [ ] Deploy 8 sub-services to Hetzner

### Codebase Analysis (2026-10-21) — verified findings
- [x] Test suites repaired: media-workflow 0→60 passing (TS5107 fix + spec-aligned error messages), contentplanner 24→35 (jest Haste collision), leadg 9, legacyleads 11 — **115 tests passing across 4 submodules**
- [x] Untracked 470MB deploy tarballs + build logs (gitignored)
- [x] Prisma model audit: 40 models, only `VerificationToken` unreferenced (NextAuth artifact — expected)

#### Real gaps found (ordered by impact)
- [ ] **5 API routes still return mock data**: `skip-trace` (whitepages/public-records mocks), `property-data` (source='mock'), `avatar`, `agents/handshake`, `cron/mls-scrub` — these need real provider keys or honest "demo mode" labeling in UI
- [ ] **Root e2e tests need a running server** (node:test against localhost:3000) — not wired into CI; add a CI job with a service container or convert to Playwright
- [ ] **foreclosureworkflow has 0 tests** — the only subproject with none; parser logic (LLMNoticeParser) is the riskiest untested code
- [ ] **legacyleads `/listings` mock data** → real MLS/property-data
- [ ] **main CRM `tsconfig.json` has `ignoreBuildErrors: true`** — type errors ship silently; tighten gradually
- [ ] **API keys still unwired**: Twilio, SendGrid/Resend, Stripe, Google Maps, HubSpot OAuth, BS&A, Magnific, OpenAI (embeddings/voice)
- [ ] 10 redundant remote feature branches safe to delete (`git push origin --delete <branch>`)

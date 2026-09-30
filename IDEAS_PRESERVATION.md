# IDEAS PRESERVATION — All Unique Concepts Across All Repos

> Harvested 2026-09-22 from every README, VISION, IDEAS, MEMORY, ROADMAP, HANDOFF, CHANGELOG, DEPLOY doc.
> **Purpose:** Ensure no idea, concept, or planned feature is lost during consolidation.
> Reference this file whenever merging or deprecating a sub-project.

---

## 1. Voice / AI Calling Projects (leadG + realestateleadcaller)

### From leadG "VoiceForge AI" — UNIQUE IDEAS
| Idea | Source | Status | Notes |
|---|---|---|---|
| DeepFake Avatar Video Sync (HeyGen/D-ID over WebRTC) | IDEAS.md | Planned | Live video avatars instead of just phone calls |
| Aggressive Memory Vectoring (RAG objection handling) | IDEAS.md | Planned | Embed successful closings, inject top 3 objection responses into live prompts across all orgs |
| Accent Morphing (ElevenLabs by area code) | IDEAS.md | Planned | Dynamically assign voice ID based on geo-location of dialed number |
| ReflectionEngine (continuous learning) | README.md | Built | Post-call transcript analysis auto-adapts objection-handling params |
| Multi-day omnichannel BullMQ campaigns | README.md | Built | Fallback SMS/email if leads drop off or hit voicemail |
| LeadRouter with A/B campaign mapping | README.md | Built | Maps leads to specialized campaign queues via tracking variables |
| Multi-tenant SaaS with Stripe usage billing | README.md | Built | Tracks API minute usage, bumps service tiers via payment webhooks |
| WebRTC browser monitoring + barge-in | TODO.md | Built | Live real-time monitoring of active calls |
| CRM connectors: HubSpot, Salesforce, GoHighLevel, Webhook | HANDOFF.md | Built | Modular connector pattern |
| Transfer-complete + voicemail webhooks | CHANGELOG.md | Built | `/api/twilio/transfer-complete`, `/api/twilio/voicemail` |
| Pilot simulation script | HANDOFF.md | Built | `scripts/start-pilot-and-simulate.sh` — full sandbox testing |
| Docker standalone output deployment | DEPLOY.md | Built | Multi-stage Dockerfile with tiny production images |

### From realestateleadcaller "Jules AI Concierge" — UNIQUE IDEAS
| Idea | Source | Status | Notes |
|---|---|---|---|
| State-machine workflows (not linear drips) | VISION.md | Built | Reactive state machines that change behavior based on lead intent/urgency |
| "Default Aggressive" 10-Day Blitz + Double Tap | VISION.md | Built | Get leads on live call within first 5 minutes |
| Direct Mail via Lob | HANDOFF.md | Built | Physical mail automation with Inngest background jobs |
| Knowledge Base Context Injection | HANDOFF.md | Built | Agent-written facts (lockbox codes, office hours) injected into Vapi voice prompts |
| Mid-Call Tool Execution (write to Calendar/DB during call) | HANDOFF.md | Built | Vapi Server URL webhooks for real-time writes during active calls |
| Bi-Directional CRM Webhooks (Follow Up Boss) | HANDOFF.md | Built | Outbound push + inbound listener that halts workflows on "Trash/Closed" |
| SentimentAnalyzer with Structured Outputs | HANDOFF.md | Built | OpenAI gpt-4o-mini with JSON extraction, auto-bumps urgency, marks DNC, auto-pauses workflows |
| Circle Prospecting Map (react-leaflet + haversine) | ROADMAP.md | Built | Radial boundary drawing + geographic CSV calling lists |
| SSE real-time map updates | ROADMAP.md | Built | Live leads popping up on map without refresh |
| Geo-Spatial Enrichment (Nominatim geocoding) | ROADMAP.md | Built | Auto-geocode addresses on lead creation |
| Predictive ML Lead Scoring | ROADMAP.md | Built | Batch evaluation across entire historical lead pool |
| Native WebRTC Dialer (browser warm transfers) | ROADMAP.md | Built | `@twilio/voice-sdk` floating NativeDialer widget |
| Visual Drag-and-Drop Workflow Builder | HANDOFF.md | Built | Inngest-backed durable execution |
| Manual Override box (push messages outside sequences) | HANDOFF.md | Built | Instant SendGrid/Twilio push from lead profile |
| Color-coded Activity Timeline (SMS/Voice/Email) | HANDOFF.md | Built | Visual differentiation of communication types |
| Dashboard KPI: Conversion, DNC, Connect rates | HANDOFF.md | Built | Recharts-powered metrics |
| Dynamic Agent Voice Provisioning | HANDOFF.md | Built | Vapi voice selection from API-fetched dropdown |
| MCP Server (Pages Router for SSE) | HANDOFF.md | Built | **CRITICAL: MCP SSE must stay in Pages Router** — incompatible with App Router |
| Global Notification Banner | HANDOFF.md | Built | Toast polling for webhook-triggered events |
| Multi-tenant RLS (userId-scoped Prisma) | HANDOFF.md | Built | Row Level Security per user |
| CSV import with geocoding | HANDOFF.md | Built | Address fields parsed on bulk import |

### Voice Merge Plan (voice-agent)
**Base:** `leadG` (more mature architecture: BullMQ, Stripe, ReflectionEngine, Postgres)
**Port from `realestateleadcaller`:**
1. Direct Mail system (Lob + Inngest) → `src/lib/direct-mail/`
2. Knowledge Base context injection → `src/lib/knowledge-base/`
3. Mid-Call Tool Execution (Calendar writes during calls) → `src/app/api/webhooks/vapi-tools/`
4. Bi-Directional CRM Webhooks (Follow Up Boss) → `src/app/api/webhooks/fub/`
5. State-machine workflow engine (vs BullMQ linear) → merge both approaches
6. Circle Prospecting Map + SSE + Geocoding → `src/app/map/`
7. Predictive ML Lead Scoring → `src/lib/scoring/`
8. Native WebRTC Dialer → `src/components/NativeDialer.tsx`
9. Visual Workflow Builder → `src/app/workflows/builder/`
10. SentimentAnalyzer with auto-pause/DNC → `src/lib/sentiment/`
11. Manual Override + Activity Timeline UI → port components
12. Knowledge Base UI → `src/app/knowledge-base/`
13. "Jules" persona branding + 10-Day Blitz/Double Tap scripts → `src/lib/scripts/`

---

## 2. Content / Social Media Projects (contentplanner + prototype)

### From socialmediacontentplanner "ContentCommand AI" — UNIQUE IDEAS
| Idea | Source | Status | Notes |
|---|---|---|---|
| Multi-Agent Workspace (NL commands → drafts/videos/podcasts/brand kits) | VISION.md | Built | Natural language orchestration |
| RAG web scraping for AI grounding | ROADMAP.md | Built | HTML scraper + LangChain chunker + image context extraction |
| AI Command Parser (zod-based NLP → JSON params) | CHANGELOG.md | Built | "Write a funny tweet" → structured params |
| Video Studio (30-sec Reel/TikTok scripts) | ROADMAP.md | Built | Scene-by-scene generation |
| Podcast Studio (outlines, guest questions, YouTube descriptions) | ROADMAP.md | Built | Full show planning |
| Brand Kits (voice rules, hex colors, banned words) | user-manual.md | Built | Auto-applied to AI generation |
| Landing Page Builder | ROADMAP.md | Built | |
| Stripe Billing + Checkout | CHANGELOG.md | Built | Real `stripe.checkout.sessions.create()` |
| BullMQ background social publishing workers | CHANGELOG.md | Built | Separate scalable container |
| PKCE OAuth flows (Twitter, LinkedIn, Meta) | CHANGELOG.md | Built | Secure token handling |
| Mobile React Native app (Expo) | CHANGELOG.md | Built | Bottom-tab navigation, pull-to-refresh |
| Mobile Native Previews (Twitter/LinkedIn mockups) | CHANGELOG.md | Built | See how posts look before scheduling |
| Live WebSocket Sync indicator | CHANGELOG.md | Built | Pulsing "Live Sync" on Campaigns UI |
| Multimodal AI Scraper (image alt-text extraction) | CHANGELOG.md | Built | RAG can "see" images |
| Learning Center with interactive tutorials | CHANGELOG.md | Built | |
| Contextual Help Overlay (page-aware tips) | CHANGELOG.md | Built | |
| Finance & Reports (ad spend, net profit estimate) | user-manual.md | Built | CSV export for accountants |
| AWS ECS Docker deployment | CHANGELOG.md | Built | Separate API + jobs containers |
| Redis-backed rate limiting | CHANGELOG.md | Built | Production-ready |
| MockPrismaClient singleton for tests | MEMORY.md | Built | In-memory DB proxy for CI/CD |
| SQLite transition [BLOCKED] | IDEAS.md | Blocked | Prisma SQLite doesn't support Enums |
| Compliance guidelines (scraping, platform policies, AI copyright) | docs/compliance.md | Documented | |
| Security safeguards (secrets, RBAC, PCI) | docs/security.md | Documented | |

### From realestateprototype "Legacy One Universal Content Platform" — UNIQUE IDEAS
| Idea | Source | Status | Notes |
|---|---|---|---|
| Universal Business-Type Switching (RE, E-Commerce, Restaurant, General) | VISION.md | Built | **KEY UNIQUE FEATURE** — dynamic UI based on business type config |
| AI Persona Customization (brand_voice from past posts) | CHANGELOG.md | Built | Persisted in SQLite users table, injected into OpenAI prompts |
| Canva Integration deep links | CHANGELOG.md | Built | "Design with Canva" in Review Drafts + Content Library |
| Twitter SDK integration (twitter-api-v2) | CHANGELOG.md | Built | Conditional real API when credentials present |
| Drag-to-Select Calendar | CHANGELOG.md | Built | Click-and-drag bounding box for multi-date selection |
| AI Draft Review System (intercept before scheduling) | CHANGELOG.md | Built | Editable drafts, discard/approve flow |
| Content Library with filtering + chronological sorting | CHANGELOG.md | Built | Category filters (all, listing, report, social) |
| Global Notification Queue (reducer-driven toasts) | CHANGELOG.md | Built | |
| Mock Background Publishing Worker | CHANGELOG.md | Built | Polls scheduled events, transitions to published |
| OAuth 2.0 Backend Integration (connect/status/disconnect) | CHANGELOG.md | Built | SQLite `oauth_connections` table |
| JWT Auth + user profiles | CHANGELOG.md | Built | Protected endpoints |
| Node/Express backend (API key security) | CHANGELOG.md | Built | OpenAI keys hidden from frontend |
| Dark Mode with CSS variable tokens | CHANGELOG.md | Built | |
| Component extraction from monolithic App.tsx | CHANGELOG.md | Built | |
| Global State (React Context + reducers) | CHANGELOG.md | Built | |
| Docker multi-stage build | CHANGELOG.md | Built | |
| Cross-platform scripts (start.bat/sh, build.bat/sh) | CHANGELOG.md | Built | |
| Third-party: Canva + HubSpot/Salesforce lead gen | IDEAS.md | Planned | Via social posts |
| Mobile App Port (React Native) | IDEAS.md | Planned | For on-the-go content approval |
| Server-Side Rendering for SEO | IDEAS.md | Planned | Next.js migration (in progress) |

### Content Merge Plan (content-studio)
**Base:** `socialmediacontentplanner` (far more complete: 22+ phases, mobile, billing, RAG)
**Port from `realestateprototype`:**
1. **Universal Business-Type Switching** (KEY) → `src/config/business-types.ts`
2. AI Persona Customization (brand_voice from past posts) → integrate into Brand Kit
3. Canva Integration deep links → `src/lib/canva/`
4. Twitter SDK real publishing → `src/lib/social/twitter.ts`
5. Drag-to-Select Calendar → upgrade Campaign Calendar
6. AI Draft Review intercept flow → `src/components/DraftReview.tsx`
7. Content Library filtering + sorting → `src/app/content/library/`
8. Mock Background Publishing Worker pattern → reference for job design

---

## 3. aicrm — UNIQUE IDEAS (to port to main CRM)

| Idea | Source | Status | Notes |
|---|---|---|---|
| AgentCore NL Command Engine | README/AGENTCORE | Built | 13 NL commands (summarize, list, create task, update lead, send email/sms, draft, negotiate) |
| AgentCore Workflow Engine (if/then automation) | AGENTCORE.md | Built | 5 triggers, 5 conditions, 8 actions including AI actions |
| MCP Server (10 CRM tools via JSON-RPC 2.0) | AGENTCORE.md | Built | `/api/mcp` endpoint, Bearer token auth |
| Claude Desktop MCP integration | AGENTCORE.md | Built | Ready-to-copy config |
| Multi-Model LLM Router (Tier 1/Tier 2) | MEMORY.md | Built | Fast/cheap vs frontier reasoning, keyword heuristics |
| Secure API Vault (AES-256-GCM encrypted keys) | MEMORY.md | Built | BYOK architecture |
| Multi-Model providers: OpenAI, Anthropic, Gemini, DeepSeek, Qwen | HANDOFF.md | Built | With fallback across tiers |
| Agentic Approval Queue | schema.prisma | Built | Human-in-the-loop for AI proposed actions |
| Agent Audit Log (chain-of-thought reasoning) | schema.prisma | Built | Track AI decision-making |
| Vector Embeddings (RAG) | schema.prisma | Built | For semantic search |
| Cross-Tenant Syndication | IDEAS.md | Planned | Anonymized market trends across brokerages |
| Gamification (points/leaderboards for agents) | IDEAS.md | Planned | Based on workflow execution, leads enriched, outbound volume |
| Predictive Lead Scoring (MLS historical data) | IDEAS.md | Planned | ML model as Tier 1 task |
| AgentCore Mobile Port (voice commands) | IDEAS.md | Planned | "Text all my Hot leads about the open house" |
| Blockchain Smart Contracts | IDEAS.md | Planned | Lease agreements / earnest money deposits |
| MiMLS/Paragon MLS Data Access (RESO Web API) | RETS_TEMPLATE | Documented | Full request template + env config |
| AgentCore Control Plane integration | INTEGRATION.md | Built | Go kernel (port 7778), memory, tool catalog, swarm orchestration |
| AgentCore pi extension | INTEGRATION.md | Built | 4 tools + 1 command |
| Funnel Builder (landing pages with custom domains) | schema.prisma | Built | |
| Social Post scheduling with media | schema.prisma | Built | |
| Campaign Execution Logging | schema.prisma | Built | Status tracking per lead/step |
| Segment management (smart filters) | schema.prisma | Built | |
| Rate limiting (auth, router, agentcore) | HANDOFF.md | Built | |
| Email verification + password reset | HANDOFF.md | Built | |
| PostgreSQL + libSQL auto-select adapter | MEMORY.md | Built | |
| Demo login: demo@aicrm.com / demo-password | README.md | Built | |

### aicrm → Main CRM Port Plan
1. **MCP Server** → `src/app/api/mcp/route.ts` (from aicrm's `/api/mcp`)
2. **NL Command Engine** → `src/lib/agentcore/engine.ts`
3. **Workflow Engine (if/then)** → `src/lib/agentcore/workflows.ts`
4. **Multi-Model LLM Router** → `src/lib/llm/router.ts`
5. **Secure API Vault** → `src/lib/vault/`
6. **Approval Queue + Audit Log** → extend Prisma schema
7. **Vector Embeddings** → integrate with existing RAG
8. **Funnel Builder** → port to main CRM's landing page system
9. **RESO/RETS MLS integration** → `src/lib/mls/` + use RETS template
10. **AgentCore Control Plane bridge** → `src/lib/agentcore/client.ts`

---

## 4. Unique Standalone Projects (NOT being merged)

### forclosureworkflow — Foreclosure-Specific Features
- Weekly Legal News scraper (Macomb County)
- Foreclosure notice parser → Lead creation
- Contact enrichment (CyberBackgroundChecks-style)
- Tax assessor integrations (headless Playwright scrapers)
- Equity & Valuation tracking (AVM APIs)
- AWS S3 document upload for leads
- Real-time voice monitoring (WebSocket)
- Data Quality Dashboard
- Twilio In-Browser Voice Calling (Voice SDK)
- GoHighLevel webhook sync
- LLM parser (raw foreclosure text → JSON)
- Custom segments + hashtag UI

### LegacyLeads "OmniLead Nexus" — Data Platform Features
- MLS data ingestion (RESO Web API standard)
- Skip-tracing cascade engine (multi-provider fallback)
- Credit/billing ledger (atomic transactions)
- Geospatial queries (Mapbox GL, Supercluster)
- BullMQ high-throughput webhook queues (10k+ req/min)
- Deduplication + record stitching
- TCPA/CAN-SPAM quiet hours (timezone-aware)
- Multi-tenant enterprise tiers

### re-agent-workflow-media-1 — Media Pipeline Features
- Folder Detection Service (Network share → MLS → Downloads → Desktop)
- Magnific AI day/night image generation
- Canva branding integration
- Lofty landing page automation
- Social caption generation (Gemini/ChatGPT)
- Approval Workflow with audit logging
- Just Sold automated pipeline
- FFmpeg video assembly
- Batch processing across listings
- Socket.io real-time dashboard

---

## 5. CROSS-CUTTING IDEAS (appear in multiple repos — consolidate)

| Idea | Appears In | Best Implementation | Action |
|---|---|---|---|
| AI Content Generation | contentplanner, prototype, aicrm | contentplanner (most complete) | Use contentplanner |
| Multi-platform Social Publishing | contentplanner, prototype, aicrm | contentplanner | Use contentplanner |
| Campaign/Drip Sequences | ALL CRM projects | forclosureworkflow (cron-driven) or leadG (BullMQ) | Standardize |
| Lead Scoring | aicrm, forclosure, leadcaller, leadG | leadcaller (ML-based) | Use ML approach |
| Voice Calling (Twilio) | leadG, leadcaller, forclosure | leadG (most complete) | Use leadG |
| Warm Transfers | leadG, leadcaller | Both (similar) | Merge |
| MCP Integration | aicrm, leadcaller | Both (different tools) | Merge tool sets |
| Geocoding/Maps | forclosure, leadcaller, LegacyLeads | leadcaller (Leaflet + SSE) | Use leadcaller |
| RAG/Vector Search | aicrm, contentplanner, main CRM | All different angles | Unified RAG |
| Auth/RBAC | All Next.js projects | Main CRM (NextAuth + workspaces) | Use main CRM |
| Stripe Billing | leadG, contentplanner, LegacyLeads | All different | Consolidate |
| Direct Mail | leadcaller only | leadcaller | Keep |
| CSV Import/Export | All CRM projects | All similar | Standardize |
| Compliance (TCPA/CAN-SPAM) | forclosure, LegacyLeads | Both | Standardize |
| Dark Mode/Theme | main CRM, prototype | Both | Use main CRM |
| Notification System | All | leadcaller (global toast) | Use leadcaller pattern |
| Workflow Builder (visual) | leadcaller, aicrm | leadcaller (drag-and-drop) | Use leadcaller |
| AI Persona/Brand Voice | prototype, contentplanner | prototype (from past posts) | Merge into Brand Kit |

---

## ARCHIVE STATUS (2026-09-29)

> All features from the following repos have been merged into their target projects.
> These repos can be safely archived on GitHub.

| Repo | Merged Into | Verified |
|---|---|---|
| `aicrm` | `realestatecrm` (AgentCore engine, MCP server, workflows, vault) | ✅ Sprint 1 |
| `realestateleadcaller` | `leadG` (27 phases: knowledge base, sentiment, geocoding, workflows, MCP, direct mail) | ✅ Sprint 1-2 |
| `realestateprototype` | `socialmediacontentplanner` (business types, brand voice, Canva, draft review) | ✅ Sprint 1-2 |

**Submodules removed from realestatecrm:** `apps/aicrm`, `apps/leadcaller`, `apps/prototype`

**Remaining active submodules:** `apps/leadg`, `apps/contentplanner`, `apps/foreclosureworkflow`, `apps/media-workflow`, `apps/legacyleads`



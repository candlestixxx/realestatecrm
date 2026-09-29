# NEXT STEPS — Full Gap Analysis & Implementation Roadmap

> Generated 2026-09-22 from complete analysis of all projects, docs, TODOs, ROADMAPs, and current code state.

---

## EXECUTIVE SUMMARY

| Project | Completeness | Blockers | Priority |
|---|---|---|---|
| **realestatecrm** (main) | ~75% | Missing UI for new AgentCore features; Phase 2-5 features incomplete | **P0** |
| **leadG** (voice agent) | ~70% | Prisma schema merge needed; integrations need wiring | **P0** |
| **contentplanner** (content studio) | ~80% | Business-type switching not wired; brand voice not connected | **P1** |
| **foreclosureworkflow** | ~90% | Minor: real-time voice monitoring | **P2** |
| **media-workflow** | ~85% | FFmpeg assembly, microservice splitting | **P2** |
| **legacyleads** | ~60% | Mapbox UI, skip-tracing cascade, credit engine | **P2** |
| **aicrm** | N/A (merged) | Features ported; repo can be archived | Done |
| **leadcaller** | N/A (merged) | Features ported; repo can be archived | Done |
| **prototype** | N/A (merged) | Features ported; repo can be archived | Done |

---

## P0 — CRITICAL (Blocks daily use)

### 1. Main CRM: AgentCore UI Integration
**Status:** Backend ported (924 lines) but **zero UI exists** for the new features.

| Gap | What's Needed | Effort |
|---|---|---|
| AgentCore Console | Build `src/components/AgentCoreConsole.tsx` — NL command terminal (type command → see result). Port from aicrm's `HyperNexusConsole.tsx`. Wire to `POST /api/agentcore`. | 2-3 hrs |
| Workflow Builder UI | Build `src/components/AgentCoreWorkflowBuilder.tsx` — create/edit if-then workflows. Wire to `AgentWorkflow` model. | 3-4 hrs |
| MCP Settings Page | Build `src/app/dashboard/settings/mcp/page.tsx` — show MCP endpoint URL, generate/manage `MCP_TOKEN`, show Claude Desktop config snippet. | 1-2 hrs |
| AI Model Manager | Build `src/app/dashboard/settings/ai-models/page.tsx` — vault UI for adding/removing LLM provider keys. Wire to `GET/POST/DELETE /api/vault`. | 2-3 hrs |
| Sidebar Navigation | Add "AgentCore" section to dashboard sidebar with links to Console, Workflows, AI Models, MCP. | 30 min |

**Total: ~1-2 days**

### 2. Main CRM: Phase 2 Incomplete Features
From ROADMAP.md — items marked incomplete:

| Gap | What's Needed | Effort |
|---|---|---|
| **Private & group chat** | Build real-time chat with Socket.io or similar. New `Message` model, chat UI, WebSocket server. | 3-5 days |
| **Lead routing & follow-up automation** | Auto-assign leads by rules (round-robin, territory, score). Wire AgentCore workflows to trigger on lead creation. | 2-3 days |
| **AI lead qualification** | Score leads using AI based on activity, source, engagement. New `LeadScore` field + scoring endpoint. | 2-3 days |
| **Learning & memory controls** | AI assistant memory management (clear, export, per-workspace settings). | 1-2 days |
| **CRM timeline writeback from voice** | When voice agent completes a call, write activity/summary to CRM timeline. Needs webhook from leadG → main CRM. | 1-2 days |

**Total: ~2 weeks**

### 3. Voice Agent (leadG): Prisma Schema Merge
**Status:** Code ported (5,043 lines) but **database schema is NOT merged**.

| Gap | What's Needed | Effort |
|---|---|---|
| Merge Prisma schemas | Combine leadG's 15 models + leadcaller's 17 models into one unified schema. Resolve field conflicts (both have `Lead`, `User`, `Campaign` with different fields). | 4-6 hrs |
| Wire Knowledge Base → Vapi prompts | When making calls, inject `KnowledgeBaseSnippet` content into the voice AI prompt. | 2-3 hrs |
| Wire Sentiment → auto-pause | Connect `SentimentAnalyzer` to pause workflows when DNC detected. | 2-3 hrs |
| Wire Geocoding → lead creation | Call Nominatim on lead create/import to populate lat/lng. | 1-2 hrs |
| Mount NativeDialer + NotificationsBanner | Add to global layout for warm transfer pickup + toast alerts. | 1 hr |
| Wire MCP Server (Pages Router) | Ensure `src/pages/api/mcp.ts` works alongside App Router routes. | 1 hr |
| Merge settings pages | Combine leadG's settings/billing with leadcaller's settings/integrations/knowledge/scripts. | 2-3 hrs |

**Total: ~3-4 days**

### 4. Content Studio: Brand Voice + Business Types
**Status:** Code copied (1,195 lines) but **not wired into the generation pipeline**.

| Gap | What's Needed | Effort |
|---|---|---|
| Wire business-type config | Make `businessTypes` config actually affect AI prompts, content templates, and UI categories. | 2-3 hrs |
| Wire brand_voice into AI generation | Inject `brand_voice` from Brand Kit into all OpenAI/Claude calls in Content/Video/Podcast studios. | 2-3 hrs |
| Wire "Analyze Past Posts" | Add UI to upload past posts → extract brand voice → save to Brand Kit. | 3-4 hrs |
| Wire Canva deep links | Add "Design with Canva" buttons to post review and media library. | 1 hr |
| Wire Draft Review intercept | Add review step before content gets scheduled from AI Studio. | 2-3 hrs |

**Total: ~2-3 days**

---

## P1 — HIGH VALUE (Drives product completion)

### 5. Main CRM: Phase 3-5 Features
| Feature | Description | Effort |
|---|---|---|
| **Social channel connections** | OAuth for Facebook/Instagram/LinkedIn/Twitter. Use contentplanner's PKCE implementation as reference. | 3-5 days |
| **Unified inbox** | Merge email/SMS/social messages into one view. | 3-5 days |
| **Publishing calendar** | Content scheduling with drag-and-drop calendar. Use contentplanner's calendar + prototype's drag-to-select. | 2-3 days |
| **Marketing studio** | AI content generation UI (posts, videos, emails). Wire to AgentCore's LLM providers. | 3-5 days |
| **Asset export flows** | Export marketing assets (images, PDFs, videos). | 2-3 days |
| **Approval workflows** | Human-in-the-loop approval before publishing. Use aicrm's ApprovalQueue model. | 2-3 days |
| **Property photo import** | Import listing photos from network share/MLS. Use media-workflow's FolderDetection. | 2-3 days |
| **AI promotional video pipeline** | Generate video from listing photos. Use media-workflow's FFmpeg + Magnific. | 5-7 days |

### 6. Voice Agent: Remaining Integrations
| Feature | Source | Effort |
|---|---|---|
| Wire BullMQ workers to real SendGrid/Twilio | leadG campaign-worker stubs | 2-3 days |
| Wire Inngest handlers to production | leadcaller's workflow engine | 1-2 days |
| WebRTC live monitoring | leadG LiveAudioMonitor → real Twilio Media Streams | 3-5 days |
| Stripe billing activation | leadG's billing stubs → live Stripe webhooks | 2-3 days |
| Pilot simulation script | `scripts/start-pilot-and-simulate.sh` | 1 day |

### 7. Content Studio: Remaining Features
| Feature | Source | Effort |
|---|---|---|
| Wire RAG scraper to generation pipeline | contentplanner's `packages/ai` | 2-3 days |
| Activate Stripe Checkout | contentplanner's billing package | 1-2 days |
| BullMQ workers → live social publishing | contentplanner's `packages/jobs` | 2-3 days |
| Mobile app → live backend | contentplanner's `apps/mobile` | 2-3 days |

---

## P2 — COMPLETION (Fills remaining gaps)

### 8. Foreclosure Workflow (90% complete)
- [ ] Real-time voice monitoring via WebSockets (1-2 days)
- [ ] Connect tax assessor scrapers to production Playwright (1 day)

### 9. Media Workflow (85% complete)
- [ ] FFmpeg video assembly → production pipeline (2-3 days)
- [ ] Microservice splitting via Redis Pub/Sub (3-5 days)
- [ ] React dashboard polish (2-3 days)

### 10. LegacyLeads (60% complete)
- [ ] Mapbox GL canvas with geofence drawing (3-5 days)
- [ ] Skip-tracing cascade engine (5-7 days)
- [ ] Credit ledger with atomic transactions (3-5 days)
- [ ] Supercluster map rendering (2-3 days)
- [ ] TCPA/CAN-SPAM quiet hours (1-2 days)

### 11. Main CRM: Phase 6-10 (Long-term)
| Phase | Features | Effort |
|---|---|---|
| Phase 6: Partner & scale | Mortgage/title/insurance modules, shared referrals, partner permissions, reporting | 2-3 weeks |
| Phase 7: Polish | Mobile offline, sync recovery, audit, accessibility, load testing | 2-3 weeks |
| Phase 8: MLS parity | Listing search, client portal setup, offer writing, listing entry | 3-4 weeks |
| Phase 9: Legacy MLS | Historical search, Realist data, offer drafting from prior listings | 2-3 weeks |
| Phase 10: BS&A/Realcomp | Property data integrations, offer/listing prefill | 2-3 weeks |
| Phase 12: Website builder | Drag-and-drop WYSIWYG, templates, IDX search | 4-6 weeks |

---

## CROSS-PROJECT INTEGRATION GAPS

These connect the sub-projects to the main CRM:

| Integration | From → To | What | Effort |
|---|---|---|---|
| **Voice → CRM timeline** | leadG → realestatecrm | Webhook: after call, push summary/activity to CRM | 1-2 days |
| **Content → CRM** | contentplanner → realestatecrm | Publish marketing content for CRM leads/listings | 2-3 days |
| **Foreclosure → CRM** | forclosureworkflow → realestatecrm | Import foreclosure leads into main CRM pipeline | 1-2 days |
| **Media → CRM** | media-workflow → realestatecrm | Trigger media pipeline on new listing in CRM | 1-2 days |
| **Data → CRM** | legacyleads → realestatecrm | Feed skip-traced leads into CRM | 2-3 days |
| **AgentCore → Voice** | realestatecrm → leadG | Trigger voice campaigns from CRM workflows | 1-2 days |
| **AgentCore → Content** | realestatecrm → contentplanner | Generate content for listings from CRM | 1-2 days |

---

## RECOMMENDED EXECUTION ORDER

### Sprint 1 (Days 1-5): Make it usable
1. **AgentCore UI** — Console, Workflow Builder, AI Models, MCP settings (main CRM)
2. **Voice schema merge** — unify Prisma models (leadG)
3. **Wire brand voice + business types** (contentplanner)

### Sprint 2 (Days 6-12): Core integrations
4. **Voice → CRM timeline webhook** (cross-project)
5. **Lead routing + AI qualification** (main CRM)
6. **Wire Knowledge Base + Sentiment + Geocoding** (leadG)
7. **Wire Draft Review + Canva** (contentplanner)

### Sprint 3 (Days 13-20): Feature completion
8. **Social connections + Unified inbox** (main CRM)
9. **Publishing calendar + Marketing studio** (main CRM)
10. **Wire RAG + Stripe + BullMQ** (contentplanner)
11. **Wire Inngest + WebRTC monitoring** (leadG)

### Sprint 4 (Days 21-30): Advanced features
12. **Media pipeline integration** (media-workflow)
13. **Foreclosure real-time monitoring** (foreclosureworkflow)
14. **LegacyLeads Mapbox + skip-tracing** (legacyleads)
15. **Approval workflows + Asset export** (main CRM)

---

## ARCHIVE CLEANUP

After verifying all features are preserved:
- [ ] Archive `aicrm` repo (features merged into main CRM)
- [ ] Archive `realestateleadcaller` repo (features merged into leadG)
- [ ] Archive `realestateprototype` repo (features merged into contentplanner)
- [ ] Remove deprecated submodules from realestatecrm (`apps/aicrm`, `apps/leadcaller`, `apps/prototype`)
- [ ] Update `IDEAS_PRESERVATION.md` to mark archived projects

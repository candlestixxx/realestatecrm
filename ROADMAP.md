# Roadmap

*Core Objective: Build a CRM with the technical depth of Lofty, simplified by an omnipresent AI Assistant (Agentic Co-Pilot).*

## Phase 1 — Foundation [ACCOMPLISHED]
- [x] TypeScript repo scaffold
- [x] Authentication and roles
- [x] Workspace model
- [x] CRM core
- [x] Base dashboard shell
- [x] Theme and branding system

## Phase 2 — Communication and workflow [IN PROGRESS]
- [x] Leads, contacts, deals, and tasks
- [x] Workspace as Segment / List model
- [x] Bulk Lead Management & Dynamic Pagination
- [x] Email / SMS / call logging (Forms and action infrastructure wired, timeline active)
- [ ] Private and group chat
- [x] Workflow engine (Foundation and initial drafts)
- [x] Dashboard Workflow Performance Overview
- [ ] Lead routing and follow-up automation
- [x] Client portal foundation

## Phase 3 — AI and voice [IN PROGRESS]
- [x] AI Assistant UI and Backend (AIChat)
- [x] RAG (Retrieval-Augmented Generation) foundation, vector sync, and unification
- [x] AI Assistant Sync (Gemini 2.0 Flash as default)
- [x] **AI Tool Calling (Agentic Co-Pilot Execution)**
- [ ] AI lead qualification
- [x] AI Drip Campaign Execution (SMS/Email)
- [x] Voice assistant
- [x] Speech provider selection
- [ ] Conversational mode
- [ ] Learning and memory controls
- [ ] CRM timeline writeback from voice sessions

## Phase 4 — Social and marketing
- [ ] Social channel connections
- [ ] Unified inbox
- [ ] Publishing calendar
- [ ] Marketing studio
- [ ] Asset export flows
- [ ] Approval workflows

## Phase 5 — Media pipeline
- [ ] Property photo import
- [ ] Storyboard generation
- [ ] AI promotional video pipeline
- [ ] Draft review tools
- [ ] Render/export jobs

## Phase 6 — Partner and scale
- [ ] Mortgage / title / insurance modules
- [ ] Shared referrals
- [ ] Partner permissions
- [ ] Reporting and analytics
- [ ] Advanced import/export
- [ ] Performance hardening

## Phase 7 — Polish and reliability
- [ ] Mobile offline support
- [ ] Sync recovery
- [ ] Audit improvements
- [ ] Accessibility refinement
- [ ] UI polish
- [ ] Load testing and bug fixing

## Phase 8 — MLS / MiRealSource parity
- [ ] Listing search parity
- [ ] Client portal setup parity
- [ ] Offer writing support
- [ ] Listing entry support
- [ ] Provider adapter layer
- [ ] Workflow parity on web and mobile

## Phase 9 — Legacy MLS / Realist support
- [ ] Historical listing search and import
- [ ] Realist property data support
- [ ] Offer drafting from prior listings
- [ ] Listing entry drafting
- [ ] Review / approval controls
- [ ] Audit and provenance tracking

## Phase 10 — BS&A and Realcomp data support
- [ ] BS&A data integration
- [ ] Realcomp data integration
- [ ] Other approved property-data sources
- [ ] Offer and listing draft prefill
- [ ] Source provenance and review controls


## 0.46.5 Update
- **MyPlusLeads Scheduler:** Optimized MyPlusLeads cron sync frequency (every 15 mins morning drop, hourly check rest of the day).
- **Lead Detail Quick Edit:** Added visual sidebar quick-edit trigger for phone/email management.
- **Categorized Multi-Phone/Email:** Supported Cell Phone 1/2/3, Work, Home, and other types with primary auto-selection.

## 0.46.0 Update
- **Lead Intelligence Center:** Multi-tab layout for Lead profile detailing social and public record AI scraper results.
- **AI Tool Calling (Co-Pilot):** Integrated tool capabilities into the chatbot route using `gemini-2.0-flash-001`.
- **Omnichannel Forms:** Wired SMS and Showing forms with fully integrated server actions logging to the activity timeline.

## 0.45.0 Update
- **Segmentation & Bulk Actions:** Overhauled lead management with bulk selection, dynamic pagination, and the "Workspace as Segment" orchestration.
- **Workflow Visibility:** Added a workflow performance overview and AI assistant status to the main dashboard.
- **Onboarding:** Integrated an interactive tour for new feature discovery.

## Lofty.com Features
- Additional accessible documentation or structured exports are required from Lofty.com to perfectly duplicate every specific menu item, button, and page.

## Phase 11 — CRM Website Builder & Marketing Subsystems
- [x] Multi-tenant real estate website infrastructure.
- [x] RESO Web API integration for IDX / MLS data syncing.
- [x] Automated property page generation with SSR / ISR.
- [x] AI Chatbot Widget (WebSockets) embedded on agent websites for warm transfers.
- [x] RESO Web API integration for IDX / MLS data syncing.
- [x] Automated property page generation with SSR / ISR.
- [ ] Comprehensive lead capture forms mapped directly to CRM Leads.
- [ ] SEO, Schema.org (JSON-LD), and Dynamic Sitemap infrastructure.
- [ ] Google Tag Manager, GA4, and Ads Conversion tracking support.
- [ ] Social Media Open Graph integrations and dynamic share widgets.
- [ ] Headless CMS connection for localized real estate blogs.

## Phase 12 — Lofty.com Website Builder Parity
- [ ] Implement a full drag-and-drop WYSIWYG website builder replicating Lofty.com features.
- [ ] Add pre-built responsive templates for Agent Sites, Single Property Sites, and Neighborhood Guides.
- [ ] Develop Advanced IDX Search capabilities directly embeddable via the builder.
- [ ] Incorporate Lead Capture popups (forced registration walls) based on viewing parameters.
- [ ] Synchronize all landing page and form data automatically with the core CRM pipeline.
- [x] Migrate local vector synchronization fallback to a hosted Pinecone database before production launch.
- [x] Hosted Vector Migration completed. Pinecone auto-detection is active via env vars (`PINECONE_API_KEY`).
- [x] Speech provider selection (OpenAI / ElevenLabs) UI and config framework implemented via Voice Settings dashboard.

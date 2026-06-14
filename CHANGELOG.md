# CHANGELOG.md

## [0.46.0] - Lead Intelligence & AI Assistant Tool Calling

- **Lead Profile Intelligence Center:** Overhauled the Lead Profile layout into a multi-tab interface with research actions for social media profiles and public records.
- **AI Scraper Infrastructure:** Integrated background simulation of AI-based research to auto-enrich profiles with property ownership, voter registration, corporate filings, and social accounts.
- **Omnichannel Tools:** Wired SMS and Showing communication forms with server-side actions, enabling timeline logging and automated keyword trigger logic.
- **AI Tool Calling (Agentic Co-Pilot):** Upgraded the global AI chat assistant model to `gemini-2.0-flash-001` with support for server-side function calling, allowing it to dynamically fetch lead count, create tasks, and lookup contacts.
- **Prisma Schema Update:** Added `DealStakeholder` and `DealRequirement` models to the database schema.


## [0.45.0] - AI-Driven Segmentation & Bulk Workflows

- **Workspace as Segment:** Formalized the multi-tenancy model to frame Workspaces as selectable Lead Segments/Lists, integrated with a global cookie-based switcher in the header.
- **Bulk Lead Management:** Implemented an interactive client-side table for Leads with master checkbox selection and a dynamic bulk action bar.
- **Dynamic Pagination:** Added server-side supported pagination limits (10, 25, 50, 75, 100) controlled via UI dropdown and URL parameters.
- **Workflow Overview:** Integrated an active workflow performance section on the main dashboard to track real-time operational pulse.
- **AI Sync (Gemini):** Added a dedicated Gemini 2.5 Flash status panel to the dashboard to monitor AI readiness for drip campaigns.
- **Onboarding Tour:** Built a first-time user tour component to explain the new segmentation mental model and bulk action features.
- **Feature Connectivity:** Wired up bulk action triggers for "Add to Segment", "Add to Workflow", and "Start AI Drip" (UI layer).
- **Bug Fixes:** Resolved build errors related to duplicate variable definitions in the Tasks page and improper anchor tag navigation in the sidebar.

## [0.44.0] - Deployment Checklist & Environment Formalization

- Expanded `.env.example` with fully documented placeholders mapping to all required application scopes (Database, NextAuth, Mail, Vectors).
- Overhauled `DEPLOY.md` to establish a robust pre-flight checklist enforcing staging build checks, DB migration sequences, and compliance verification.
- Validated workspace demo fallback mechanisms to ensure they automatically seal when local bypass keys are omitted from the production environment.

## [0.43.0] - Marketing Media Pipeline

- Scaffolded the Marketing Media Pipeline state model for handling image generation, video assembly, and social distribution tracking.
- Built the Image Workflow UI component handling Day/Night variant logic, Magnific AI prompt previewing, and stage review states.
- Built the Video Workflow UI component featuring timeline selection placeholders, 9:16/16:9 format switching, and enhancement toggles.
- Added the Integration shell to handle syncing finished marketing materials to Lofty Landing Pages and formatting captions for cross-platform Social Posts.
- Registered new server routes to serve the compiled Media Pipeline under `/workflows/marketing-media`.

## [0.42.0] - Role Hierarchy + Compliance Boundary

- Formalized role hierarchy into `OWNER`, `BROKER`, `ASSOCIATE_BROKER`, `REALTOR_AGENT`, `OFFICE_MANAGER`, `ADMIN` enum mapping.
- Introduced `hasPermission` and `requireWorkspaceRole` in `src/lib/workspace-access.ts` to strictly enforce role constraints dynamically.
- Applied strict `BROKER` role checks to the `submitWorkflowSession` endpoint to enforce compliance boundaries preventing unauthorized deal publish/submit actions.
- Surfaced the active workspace role inside the global dashboard UI for visual clarity.

## [0.41.0] - Auth Hardening & Regression Guard

- Audited and hardened workspace isolation across API routes and Server Actions.
- Ensured `src/app/api/workflows/[workflowId]/route.ts` correctly resolves session before operating on workflows.
- Hardened `saveWorkflowSession` and `submitWorkflowSession` to strictly enforce `workspaceId` matching.
- Added rigorous explicit Prisma `where: { workspaceId }` filtering into dashboard page read operations.



## [0.40.0] - AI Assistant Refinement & Dashboard Consolidation

- Added Vercel AI SDK tool calling functionality (`getLeadCount`, `getRecentDeals`) to `/api/chat` route.
- Updated `AIChat` frontend component to use `@ai-sdk/react` `useChat` and display database tool invocation states dynamically.
- Fixed NextAuth credential login bug by correcting the expected payload from `username` to `email`.
- Consolidated duplicate `/dashboard` routes and layouts to ensure the AI assistant mounts globally across the main CRM application.
- Resolved `ai` and `zod` module resolution conflicts to pass all TypeScript and ESLint checks.


## [0.39.0] - RAG Consolidation & Code Clean-up

- Consolidated RAG vector sync and query logic by merging `src/lib/rag-sync.ts` into `src/lib/rag.ts`.
- Re-routed all references from `rag-sync.ts` across the application to `rag.ts`.
- Resolved residual type errors related to Prisma queries in CRM layouts and Activity server actions.

## [0.37.0] - Auth Hardening & Workspace Permission Enforcement

- Added middleware protection for authenticated dashboard, CRM, workflow, portal, and AI routes.
- Introduced workspace access resolution based on authenticated NextAuth sessions instead of trusting raw client claims.
- Scoped CRM list/detail queries and record-creation server actions to the active workspace.
- Kept demo access and the file-backed CRM fallback intact for local development.

## [0.36.0] - Hosted Vector Provider Finalization

- Added a provider switch for Pinecone or custom vector sync endpoints, with Pinecone auto-detection via environment variables.
- Kept the deterministic local embedding/vector-index fallback so the CRM still works without hosted infrastructure.
- Added remote vector query support so workspace chat can retrieve semantic results from a hosted provider when available.
- Documented Pinecone-specific environment variables alongside the existing RAG sync settings.

## [0.35.0] - Vector Embeddings & CRM Retrieval Wiring

- Added OpenAI-backed embeddings with a deterministic local fallback for development.
- Created a local vector index/outbox sync pipeline for activity, contact, lead, and deal records.
- Switched AI chat context from keyword-only summaries to semantic retrieval from workspace-scoped vector matches.
- Wired lead, contact, deal, and activity writes to sync into the vector store automatically.
- Documented the new RAG/vector env vars and ignored local vector index artifacts in git.

## [0.1.0] - Initial Planning & Documentation

- Created foundational documentation (VISION, MEMORY, DEPLOY, AGENTS, etc.).
- Defined architecture and phase 1 roadmap.
- Initialized version tracking.

## [0.2.0] - Next.js Scaffold

- Initialized Next.js project with TypeScript, Tailwind CSS, and App Router.

## [0.3.0] - CI/CD & Formatting

- Set up Prettier for code formatting.
- Renamed project in package.json to real-estate-crm.

## [0.4.0] - Theme & Landing Page

- Implemented Black/Blue/Gold luxury theme in globals.css.
- Added landing page stub matching the design identity.

## [0.5.0] - Authentication & CI/CD Scaffold

- Created GitHub Actions CI workflow for lint and build.
- Installed NextAuth and created the NextAuth configuration, route handler, and sign-in page.

## [0.6.0] - Database & Dashboard Scaffold

- Initialized Prisma and defined core schema (User, Workspace, Contact, Lead, Deal).
- Scaffolded the base dashboard shell layout and home page.

## [0.7.0] - Leads & Deals UI Scaffold

- Created Leads list view (`leads/page.tsx`).
- Created Deals kanban pipeline view (`deals/page.tsx`).

## [0.8.0] - Prisma SQLite Setup

- Switched Prisma to use local SQLite for development.
- Generated Prisma Client and exported a singleton in `src/lib/prisma.ts`.

## [0.9.0] - Database Seeding & UI Data Wiring

- Created a mock seed script (`prisma/seed.ts`) to populate the development database.
- Updated Dashboard, Leads, and Deals UI to fetch and render actual data from the database using Prisma.

## [0.10.0] - UI Modals & Actions

- Created `AddLeadModal` and Server Action for creating Leads.
- Created `AddDealModal` and Server Action for creating Deals.

## [0.11.0] - Contacts UI & Data Wiring

- Scaffolded the Contacts view (`contacts/page.tsx`) connecting to Prisma.
- Implemented `AddContactModal` and server action for creating new contacts.

## [0.12.0] - Session Management & Protected Routes

- Added `SessionProvider` wrapper to `layout.tsx`.
- Implemented `middleware.ts` to protect dashboard routes with NextAuth.
- Updated `(dashboard)/layout.tsx` to display logged-in user data from NextAuth session.

## [0.13.0] - Database Authentication Flow

- Wired NextAuth credentials provider to validate against the Prisma database.
- Updated the sign-in page to execute NextAuth client-side sign-in.
- Added a dynamic Sign Out button to the dashboard sidebar.

## [0.17.0] - Zod Validation & Dynamic Dashboard Data

- Implemented robust Zod schema validation across all core data models (`Lead`, `Deal`, `Contact`, `Task`).
- Updated all Server Actions to parse and return validation errors gracefully.
- Refactored `AddLeadModal`, `AddDealModal`, `AddContactModal`, and `AddTaskModal` to capture and display these validation errors without crashing the UI.
- Wired up the main `Dashboard` view to query Prisma dynamically, calculating active leads, pipeline values, and pending tasks based on actual data rather than mocks.

## [0.18.0] - UI Polish & Toast Notifications

- Added `react-hot-toast` to provide user feedback upon form submissions.
- Wrapped `Providers` with the `<Toaster />` context styled for the luxury theme.
- Configured all Modals (`AddLeadModal`, `AddDealModal`, `AddContactModal`, `AddTaskModal`) to fire a `toast.success` upon successful server action completion.

## [0.19.0] - Activity Scaffolding & Dynamic List Filtering

- Added URL-based search (`q`) and `status` filtering to the Leads, Contacts, and Tasks list pages, fully satisfying strict Next.js 15 `useSearchParams` patterns.
- Scaffolded the `Activity` data model in Prisma. This lays the groundwork for the core CRM activity timeline (logging when lead states change, notes, emails, calls).

## [0.20.0] - Activity Timeline & Notes

- Built the `AddActivityForm` component, allowing users to log notes on a Lead record.
- Added `activitySchema` in Zod to validate activity additions.
- Wired the `/leads/[id]` detail view to render the timeline dynamically using the newly scaffolded `Activity` model in Prisma.

## [0.21.0] - Upstream Workflow Synchronization

- Executed strict recursive merge of `origin/main` upstream features (Offer Draft and Listing Entry workflows) with local `main` branch.
- Successfully resolved all TypeScript collisions resulting from workflow scaffolding overlapping with core CRM `useSearchParams` filtering.
- Prevented schema divergence related to `Task` due dates to guarantee build stability alongside upstream UI additions.
- Verified stable production compile.

## [0.22.0] - Task Assignments, Due Dates, and Lead Pagination

- Safely solved ambiguous relation schema collisions by using named relations (`@relation("TaskAssignee")`) for `Task.assignedTo`.
- Updated `Task` Prisma model and Zod schemas to support `dueDate` and `assignedToId`.
- Updated `AddTaskModal` UI and the backend Server Action to capture, validate, and store Task deadlines and assignments.
- Implemented `take`/`skip` server-side pagination on the Leads list view using Next.js `searchParams`.

## [0.23.0] - Universal Pagination & Activity Propagation

- Extended the `take`/`skip` server-side pagination model uniformly across the `Contacts` and `Tasks` list pages to match `Leads`.
- Expanded the polymorphic `AddActivityForm` to `Deals` and `Contacts` detail views, ensuring unified timeline tracking across the entire CRM stack.
- Completed architectural analysis of the upstream `WorkflowStudio` components, generating `WORKFLOW_ANALYSIS.md` to map out upcoming DB integration phases.

## [0.24.0] - Workflow Schema Wiring & Dashboard Deep Linking

- Scaffolded `WorkflowSession` model in Prisma to track user workflow drafts (e.g. `OFFER_DRAFT`, `LISTING_ENTRY`).
- Removed local-storage mock handlers in upstream `WorkflowStudio` components.
- Introduced `src/lib/actions/workflow.ts` (Next.js Server Actions) to save and submit JSON workflow payloads directly to the SQLite backend.
- Converted aggregate dashboard metrics into deep-links (e.g., clicking "Tasks Due" pushes the user to `/tasks?status=TODO`).

## [0.25.0] - Phase 2 Workflow DB Hookups

- Built `src/lib/validations/workflow.ts` schema to enforce strict checking of workflow JSON payloads.
- Converted `/workflows/offer-draft` and `/workflows/listing-entry` to dynamic Server Components that parse `?sessionId` from the URL.
- These workflow pages now fetch existing `WorkflowSession` records from Prisma and inject their parsed JSON histories into `WorkflowStudio` components.
- The `WorkflowStudio` interactive shell is now a true persistent interface connected to the SQLite backend.

## [0.26.0] - Phase 2 Portal Scaffolding & Deal Workflows

- Integrated `WorkflowSession` routing deeply into the Deal Details view. Users can now spin up active Offer Drafts and Listing Entries directly associated to a specific CRM `Deal`.
- Created the foundational `(portal)` route group, establishing the client-facing UI shell (separate from the agent dashboard) where clients will eventually sign and review synced workflows.

## [0.27.0] - Portal Auth Routing & Handoff Preparation

- Reconfigured `next-auth` JWT callbacks (`src/lib/auth.ts`) to inject Prisma user roles and IDs directly into the session token.
- Applied `src/proxy.ts` middleware matcher to automatically protect the new `/(portal)` route group.
- Implemented data-driven views on `/portal` mapping the logged-in user's email directly to a `Contact` record, fetching their specific active `Deals` and pending `WorkflowSessions`.
- Reconciled tracking documentation for handoff to Phase 3 agents.

## [0.28.0] - Phase 3 AI Foundations

- Introduced the global floating `AIChat.tsx` interface on all `/(dashboard)` layouts, serving as the primary interactive surface for the upcoming AI assistant.
- Formulated and documented the `AI_RAG_STRATEGY.md` which establishes the architectural blueprint for syncing Prisma entities (`Lead`, `Activity`) with an external Vector Database.

## [0.29.0] - AI Assistant Backend Integration

- Installed `@ai-sdk/openai` and `ai` libraries to handle high-performance text streaming.
- Created `/api/chat` route to act as the primary Next.js Edge proxy for OpenAI LLM interactions, injecting strict brand and workflow context into the system prompt.
- Hand-rolled a custom streaming fetch implementation inside `AIChat.tsx` to handle streaming responses seamlessly within the UI without introducing external UI library module resolution conflicts.

## [0.30.0] - Repository Cleanup & Organization

- Reorganized project root to heavily reduce clutter.
- Consolidated all agent-specific prompting instructions (`CLAUDE.md`, `GPT.md`, etc.) into `docs/agents/`.
- Moved historical planning docs and initial prompts to `docs/archive/` (`WORKFLOW_ANALYSIS.md`, `MEMORY.md`, `GEMINI_IMPLEMENTATION_PROMPT.md`).
- Refined `README.md` to link directly to the new structural locations.

## [0.31.0] - AI SDK Typing Stabilization & Environment Recovery

- Safely navigated node environment block and preserved architectural changes.
- Conducted experimental integration of `ai` SDK tools for Prisma DB context extraction.
- Reverted experimental tool logic due to breaking TypeScript API changes between `ai@3.1.x` and `toTextStreamResponse()` requirements, guaranteeing project build stability.

## [0.32.0] - Client Portal Magic Links (Phase 2 completion)

- Migrated NextAuth configuration to use the `@next-auth/prisma-adapter` natively.
- Implemented `EmailProvider` for Magic Link authentication to support frictionless Client Portal logins without managing user passwords.
- Added `VerificationToken` to Prisma schema to support secure login verification.

## [0.33.0] - GitHub Sync & Release Checkpoint

- Rebased the local branch on top of the latest GitHub `main` and resolved merge conflicts in auth and environment files.
- Reapplied the Prisma, dashboard, workflow, and auth workspace changes after the upstream merge.
- Verified the repo with `npm run lint` and `npm run build`.
- Successfully pushed the merged state back to `origin/main`.

## [0.34.0] - Workspace-Aware RAG Sync Wiring

- Added a shared activity server action that persists CRM activity records and triggers vector sync after each save.
- Added a RAG sync helper with a remote vector endpoint path and a local outbox fallback at `data/rag-outbox.json`.
- Upgraded the chat API to inject workspace-aware CRM context before streaming responses.
- Kept the dashboard contact, lead, and deal activity screens wired to the shared server action for consistent sync behavior.

## [0.41.0] - UI Polish: Comprehensive Tooltips

- Added `@radix-ui/react-tooltip` and scaffolded the base `Tooltip` component via Shadcn patterns.
- Integrated `TooltipProvider` globally into `Providers.tsx`.
- Implemented contextual tooltips across Dashboard Home metric cards.
- Implemented header explanation tooltips on the Leads, Deals, Contacts, and Tasks list pages.
- Added field-level help tooltips to complex inputs in the `AddLeadModal` and `AddActivityForm`.
- Fixed Next.js linting errors related to unescaped apostrophes in UI copy.

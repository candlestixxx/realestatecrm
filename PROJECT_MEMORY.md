[PROJECT_MEMORY]

## Core Objective
To build a real estate CRM that is **as technical and data-dense as Lofty, but significantly simpler to use**. This simplicity is achieved by incorporating an **omnipresent AI Assistant** (Agentic Co-Pilot via Tool Calling) that helps users navigate features, execute bulk actions, and manage workflows seamlessly.

## Architecture & Technology Stack

- **Framework:** Next.js 15+ (App Router, Turbopack enabled)
- **Language:** TypeScript across frontend and backend.
- **ORM & Database:** Prisma ORM. Currently configured to use local SQLite (`dev.db`), with plans to migrate to a scalable edge-friendly provider (like Turso/libSQL or a hosted Postgres) before production. Prisma is pinned to `^5.14.0` (resolving to `v5.22.0`) to avoid SQLite lock contention issues in newer versions during concurrent development and testing.
- **Authentication:** NextAuth.js configured with a custom Credentials provider. It uses a Next.js Middleware/Proxy pattern (`src/proxy.ts` required due to Turbopack edge constraints) to secure `(dashboard)` and `(portal)` routes and redirect unauthenticated users to `/auth/signin`. The NextAuth `session` and `jwt` callbacks are deeply integrated to expose `user.id` and `user.role` natively.
- **AI Infrastructure:** Integrating `@ai-sdk/openai` and `ai` (Vercel AI SDK) for real-time streaming LLM endpoints (`/api/chat`).
- **Styling & UI:** Tailwind CSS v4, adhering to a strict luxury theme palette (Black/Blue/Gold). Components use `react-hot-toast` for unified mutation feedback.

## Core Patterns & Conventions

- **Server Actions over API Routes:** For data mutations (e.g., adding a lead, creating a deal, logging an activity, saving workflows), the project relies heavily on Next.js Server Actions placed in the same component file or within `src/lib/actions/`. This streamlines data flow and leverages `revalidatePath` for optimistic UI updates.
- **Input Validation (Zod):** Zod schemas are defined in `src/lib/validations/` (e.g., `lead.ts`, `deal.ts`, `workflow.ts`) and actively utilized within Server Actions to rigorously parse and validate incoming `FormData` before hitting Prisma. Error strings are passed back to client components for display.
- **Route Groups & Collisions:** The application uses route groups extensively (`(dashboard)`, `(portal)`). Because Next.js 15 throws build errors if two route groups resolve to the exact same root path, the portal was explicitly nested under `src/app/(portal)/portal/page.tsx` to prevent collision with `(dashboard)/page.tsx`.
- **Suspense Boundaries & Query Params:** Extensive use of `React.Suspense` is required around components that consume `useSearchParams`. List pages (Leads, Contacts, Tasks) use URL parameters (`?q=`, `?page=`, `?status=`) for advanced search, filtering, and server-side `take`/`skip` pagination.
- **Component Colocation:** Modals and specific UI components (like `AddLeadModal.tsx`) are colocated near their associated views. Modals handle error state rendering derived from their paired Server Action.
- **Navigation:** Strict usage of Next.js `<Link>` components over raw HTML `<a>` tags to enable prefetching and smooth SPA-like transitions within the App Router.

## Data Models (Prisma Schema)

- **User & Workspace:** Foundational multi-tenant structure. Users belong to a Workspace.
- **CRM Entities:**
  - `Contact`: Established relationships (People).
  - `Lead`: Potential clients, tracked by status (e.g., NEW, CONTACTED). Linked to a Contact.
  - `Deal`: Transactions tracked through a pipeline (e.g., PROSPECTING, UNDER_CONTRACT, CLOSED). Linked to a Contact.
  - `Task`: Action items assigned to Users (`@relation("TaskAssignee")`), linked to Workspaces. Status tracked via `TODO`, `IN_PROGRESS`, `DONE`. Poly-morphic assignment logic is active and stable.
  - `Activity`: Timeline events (e.g., `NOTE`, `CALL`) linked poly-morphically to Leads, Deals, Contacts, and Users.
  - `WorkflowSession`: Persists JSON state payloads for complex multi-step forms (e.g., `OFFER_DRAFT`, `LISTING_ENTRY`), enabling users to save, resume, and eventually submit drafted documents.

## Recent Architectural Decisions & Workarounds

- **Role Hierarchy & Compliance Boundary (Project 02):** Established a formal role-based access control (RBAC) system.
    - **Canonical Roles:** Defined `AppRole` enum (OWNER, BROKER, ASSOCIATE_BROKER, REALTOR_AGENT, OFFICE_MANAGER, ADMIN) in `src/lib/permissions.ts`.
    - **Permission Matrix:** Created a mapping of roles to specific app permissions (e.g., `approve:listings`, `view:financials`), enforced via `hasPermission` and `isAtLeastRole` helpers.
    - **Enforcement:** Applied role checks to server actions (`createActivityAction`, `addLead`, etc.) and filtered UI elements (dashboard metrics, team management list, activity forms) based on the user's active workspace role.
    - **UI Identity:** Added role badges to all primary dashboard and detail views to provide clear feedback on the user's current authority level.

- **Auth Hardening & Workspace Scoping (Project 01):** Rigorously enforced workspace isolation across all primary app surfaces. 
    - **Server Actions:** Hardened `saveWorkflowSession`, `createActivityAction`, `addLead`, `addContact`, `addDeal`, and `addTask` to derive `workspaceId` directly from the authenticated session (`requireWorkspaceAccess`) rather than trusting client-supplied form values.
    - **API Routes:** Restored session protection to `api/workflows/[workflowId]/route.ts` which was identified as a security regression.
    - **UI Lists:** Scoped the `workspaces`, `users`, and `contacts` lists in the Dashboard and Modal components to only show data relevant to the authenticated user's active workspace.
    - **Data Integrity:** Ensured entity lookups (Leads, Deals, Contacts) in detail views and linking actions use `findFirst` with both `id` and `workspaceId` to prevent cross-tenant data leakage.

- **Workflow Engine Implementation:** Migrated upstream static workflow shells away from Local Storage. They are now deeply wired to the SQLite backend via the `WorkflowSession` model. Server actions parse `?sessionId` parameters from the URL to rehydrate drafts dynamically.
- **Deal-Workflow Integration:** The `deals/[id]` detail view was expanded to query and list active `WorkflowSessions` associated with the deal. Users can launch new drafts (passing `?dealId=...` in the URL) directly from the Deal screen, successfully bridging the CRM core with the Workflow engine.
- **Client Portal Scaffolding & Security:** Scaffolded the `(portal)` route group as a distinct environment. The Portal verifies the NextAuth session, matches the user's email against the `Contact` table, and exclusively renders their related Deals and Action Items.
- **Phase 3 AI Scaffolding:** Introduced `AIChat.tsx` as a global layout component and wired it to `api/chat` using OpenAI streaming. An attempt to map `Vercel AI SDK` tools directly to Prisma queries was safely aborted and documented due to a volatile TypeScript mismatch between `ai@3.1.x` and the text stream return types.

- **Workspace Orchestration & Segmentation (v0.44.0):** Overhauled the multi-tenancy model to support global workspace switching.
    - **Global Switcher:** Implemented `WorkspaceSwitcher.tsx` using a secure cookie (`x-workspace-slug`) to persist the active segment across the entire dashboard.
    - **Segmentation Mental Model:** Formalized "Workspaces" as "Segments/Lists" for lead grouping.
    - **Persistence:** Created `setWorkspaceAction` to manage the cookie-based state on the server.

- **Bulk Management & Dynamic UI (v0.44.0):** Significantly expanded the data management capabilities of the Leads module.
    - **LeadTableClient:** Built a high-performance interactive table supporting individual and master-checkbox selection.
    - **Dynamic Pagination:** Implemented server-side supported dynamic limits (10, 25, 50, 75, 100) controlled via URL parameters.
    - **Bulk Actions Bar:** Created a conditional UI layer that appears upon lead selection, providing triggers for Segments, Workflows, and AI Drip campaigns.

- **Dashboard Split View & AI Sync:** Enhanced the primary entry point to provide operational visibility.
    - **Workflow Overview:** Integrated a real-time list of active `WorkflowSession` records onto the dashboard home.
    - **Gemini Assistant Sync:** Added an AI status panel to track the readiness of the Gemini 2.5 Flash assistant for automated execution.
    - **Onboarding System:** Implemented `OnboardingTour.tsx` to guide first-time users through the new segmentation and bulk workflow features.

- **Lead Intelligence & Enrichment (v0.46.0):** Overhauled the Lead Profile into a multi-tab intelligence center.
    - **Scraper Infrastructure:** Created `LeadIntelligence.tsx` featuring triggers for Social Media and Public Records scrapers (AI-simulated research).
    - **Sync Choices:** Implemented "Sync from Queue" and "Sync from Workflow" actions on the main Leads page to centralize intake.
    - **Bulk Segmentation:** Expanded the bulk action bar to include instant conversion to Deals, Smart Plans, and AI Assistance.
    - **Bidirectional Links:** Connected Leads to active `WorkflowSession` records via a dedicated "Workflows" tab in the profile view.

## Roadmap & Future Directions

- **AI Drip Execution (Twilio/SendGrid):** Wire up the backend logic to the "Start AI Drip" button to allow Gemini to dispatch actual SMS and Email follow-ups.
- **Workflow Automation:** Expand the Bulk Action bar to support automated data mapping between selected leads and transaction workflows.
- **Tool Calling Refinement (AI):** The immediate priority is executing a clean dependency audit for `ai` and `@ai-sdk/react` to allow server-side function calling (e.g., `prisma.lead.count()`) directly inside the `/api/chat` router.

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

## Tech Debt & Improvements
- [ ] Evaluate Drizzle ORM for edge compatibility.
- [x] Robust port conflict handling for Playwright tests.
- [ ] Implement WebSocket/WebRTC for real-time chat and voice.

## 0.39.0 Backlog Adjustments
- [x] Fix Next.js 15 `searchParams` unwrap issue on the signin page.
- [x] Implement Activity Type selector (`NOTE`, `CALL`, `EMAIL`, `SMS`, `MEETING`) in `AddActivityForm`.

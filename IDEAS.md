# IDEAS.md

This document contains ideas for improvements, refactoring, new features, and pivots derived from deep analysis of the project's state.

## 1. Architectural & Engineering Enhancements

- **Zod for Schema Validation:** (Completed in v0.17.0)
- **Dynamic Dashboard Metrics:** (Completed in v0.17.0)
- **Toast Notifications:** (Completed in v0.18.0)
- **Drizzle ORM Evaluation:** Since the project uses SQLite and might move to Edge computing (Cloudflare/Vercel Edge), consider evaluating Drizzle ORM over Prisma for smaller bundle sizes and better Edge compatibility, especially if moving to Turso (libSQL).
- **tRPC / Server-Side API Layer:** For more complex client portal data fetching and sharing, consider introducing tRPC to maintain end-to-end type safety instead of solely relying on Server Actions.
- **WebSocket / WebRTC:** The vision mentions "Private and group chat" and "Conversational Workflows" (voice). Introduce a Socket.io or LiveKit/Daily.co integration for real-time WebRTC voice and text communication.

## 2. Feature Refinements (CRM Core)

- **Advanced Filtering & Sorting:** Add dynamic filtering (by status, priority, owner, date) and pagination to Leads, Contacts, and Deals using URL query parameters (Next.js `useSearchParams`).
- **Global Search:** Implement a command palette (`cmdk`) that allows users to instantly search across Leads, Deals, Contacts, and Tasks.
- **Activity Timeline:** Every entity (Lead, Deal, Contact) should have an activity timeline. Create an `Activity` model in Prisma to log when a lead was created, stage changed, or notes added.
- **Task Assignments & Due Dates:** Currently tasks are simple. Add `assignedToId` (User) and `dueDate` (DateTime) to the Task model. Implement a calendar view for tasks.
- **Deal Pipelines / Kanban State:** Implement drag-and-drop for the Deals Kanban board (using `@hello-pangea/dnd` or `@dnd-kit/core`) to visually update deal stages.

## 3. Product Pivots & Expansions

- **Workflow Engine (Phase 2):** Build a visual node-based workflow builder (using `reactflow`) for lead routing and automated email/SMS drips.
- **Client Portal (Phase 2):** Create a separate route group (e.g., `(portal)`) where clients can log in via magic link to view the status of their transaction, upload documents, and see assigned tasks.
- **AI Integration (Phase 3):** Integrate OpenAI API or Anthropic Claude API to generate "Deal Summaries" or "Lead Follow-up Drafts" based on the activity timeline.

## 4. Documentation & DevOps

- **Swagger / OpenAPI Specs:** If exposing an API for partner integrations, generate OpenAPI specs.
- **CI/CD Actions:** Add GitHub Actions for automated Playwright end-to-end testing, linting, and type checking on every PR.

## 5. Aggressive Expansion Ideas (2026-06-10)

### Real-Time and Infrastructure
- **Redis Cluster for Message Broker**: Install Memurai/Redis on Windows to enable full inter-service event messaging (media-workflow currently drops payloads).
- **gRPC Microservice Mesh**: Replace REST calls between services with gRPC for type-safe, high-performance inter-service communication.
- **Event Sourcing Pattern**: Use Redis Streams or Kafka for full event sourcing on all entity mutations.

### AI and Automation
- **Multi-Model Agent Routing**: Route different task types to specialized models (Gemini for content, GPT-4 for analysis, local Llama for privacy-sensitive data).
- **Autonomous Lead Nurturing**: AI agent that monitors lead behavior and autonomously sends follow-ups and escalates hot leads.
- **Predictive Deal Scoring**: ML model trained on historical deals to predict close probability and suggest next actions.
- **Voice-First CRM**: Full voice control - dictation for notes, voice navigation, hands-free lead updates during showings.

### Platform and Scale
- **Plugin Architecture**: Allow third-party integrations via a plugin API with sandboxed execution.
- **Multi-Brokerage White-Label**: Full white-label support with custom domains, branding, and feature flags per brokerage.
- **Mobile-First Field Agent App**: React Native app with offline map, camera-based document capture, and GPS check-ins.

### Data and Intelligence
- **Market Heat AI**: Real-time market analysis combining MLS data, tax records, and social signals.
- **Automated Comp Analysis**: AI generates comparative market analyses (CMAs) from MLS data and recent sales.
- **Natural Language Report Builder**: Users ask for reports in plain English.
- **Predictive Maintenance Alerts**: Predict maintenance needs from property age, weather, and tenant reports.

### Revenue and Growth
- **Embedded Mortgage Calculator**: In-app pre-qualification tool that captures leads and routes to partner mortgage brokers.
- **Marketplace for Agent Services**: Agents can buy/sell leads, share referrals, and offer services.
- **AI-Powered SEO Engine**: Automatic SEO optimization for agent websites with keyword research and ranking tracking.


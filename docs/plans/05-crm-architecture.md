# 05 — CRM Architecture & System Overview

## System Architecture

```
┌─────────────────────────────────────────────────┐
│                 RealEstateCRM                    │
│              (Next.js 16 + TypeScript)            │
├─────────────┬───────────────┬───────────────────┤
│   Frontend  │   API Routes  │   Background      │
│   (React)   │   (Next.js)   │   (Workers)       │
├─────────────┴───────────────┴───────────────────┤
│              Prisma ORM                          │
├──────────────┬──────────────┬───────────────────┤
│  PostgreSQL  │  File-backed │  Vector Store     │
│  (production)│  (dev/demo)  │  (Pinecone/local) │
└──────────────┴──────────────┴───────────────────┘
         │              │              │
    ┌────┴────┐   ┌─────┴─────┐  ┌────┴────┐
    │  Lofty  │   │  MyPlus   │  │  MLS    │
    │  (CRM)  │   │  (Leads)  │  │  (Data) │
    └─────────┘   └───────────┘  └─────────┘
```

## Data Models (Prisma Schema)

### Core Entities

- **Workspace** — tenant isolation (slug: `excel-legacy-team`)
- **User** — auth + role (Admin, Agent, Broker)
- **WorkspaceMember** — user ↔ workspace mapping
- **CrmRecord** — contacts, leads, deals
- **WorkflowDraft** — workflow shell state

### Supporting Entities

- **Lead** — status (PREFORECLOSURE, ACTIVE, etc.), assignment
- **Contact** — name, phone, email, address
- **Activity** — notes, calls, emails, tasks
- **VectorDocument** — RAG/semantic search index

## Role Hierarchy

| Role | Permissions |
|------|-------------|
| Owner | Full access, billing, settings, delete |
| Broker | Manage agents, compliance, approvals |
| Associate Broker | Agent permissions + limited broker |
| Realtor Agent | Own leads, own deals, own workflows |
| Office Manager | Operations, scheduling, reports |
| Admin | System config, user management |

## Integrations

### Lofty (Primary CRM)

- **API:** REST v1.0, auth: `token <API_KEY>`
- **Purpose:** Lead storage, pipeline, follow-up, landing pages
- **Code:** `src/lib/integrations/lofty.ts`

### MyPlus Leads (Lead Provider)

- **Portal:** https://portal.myplusleads.com
- **Integration:** Native Lofty sync in portal
- **Purpose:** Foreclosure leads, enrichment, phone matching
- **Code:** `src/lib/integrations/myplus.ts`

### MLS / Realcomp / BS&A / MiRealSource

- **Purpose:** Property data, listing sync
- **Code:** `src/app/api/search/route.ts`

### Vector / RAG Pipeline

- **Provider:** OpenAI embeddings + Pinecone (or local fallback)
- **Purpose:** Semantic search across CRM data
- **Env vars:** RAG_EMBEDDING_MODEL, RAG_VECTOR_ENDPOINT, RAG_VECTOR_API_KEY, RAG_VECTOR_PROVIDER

### Analytics

- **Google Analytics:** G-HCMP10SZR
- **Facebook Pixel:** 3479529585645081

## Key Routes

| Route | Purpose |
|-------|---------|
| `/dashboard` | Main hub, record list |
| `/dashboard/leads` | Lead management |
| `/dashboard/contacts` | Contact directory |
| `/dashboard/sync-queue` | MyPlus → Lofty sync |
| `/dashboard/deals` | Deal tracker |
| `/workflows/foreclosure-intake` | Legal News intake |
| `/workflows/offer-draft` | Offer workflow |
| `/workflows/listing-entry` | Listing workflow |
| `/api/sync-queue` | Queue CRUD + verification |
| `/api/workflows/[id]` | Workflow state load/save |
| `/api/search` | MLS property search |

## Auth Flow

```
Login → NextAuth credentials → JWT session → Middleware guard → Dashboard
         ↓                                              ↓
    SessionProvider                              requireWorkspaceAccess()
         ↓                                              ↓
    useSession() everywhere                        Workspace-scoped queries
```

## File-Backed Dev Store

For local development without a database:

- `data/crm-records.json` — CRM records
- `data/sync-queue.json` — sync queue items
- `data/workflow-state.json` — workflow drafts
- `data/vector-index.json` — local vector store
- `data/rag-outbox.json` — pending vector syncs

Prisma schema is still defined for production migration.

## Environment Variables

```
# Database
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...

# Lofty
LOFTY_API_KEY=...
LOFTY_API_BASE=https://api.lofty.com/v1.0

# MyPlus
MYPLUS_USERNAME=...
MYPLUS_PASSWORD=...

# AI/RAG
OPENAI_API_KEY=...
RAG_EMBEDDING_MODEL=text-embedding-3-small
RAG_VECTOR_PROVIDER=local
RAG_VECTOR_ENDPOINT=...
RAG_VECTOR_API_KEY=...
PINECONE_API_KEY=...
PINECONE_INDEX_HOST=...
PINECONE_NAMESPACE=excel-legacy-workspace

# MLS
MIREALSOURCE_USERNAME=...
MIREALSOURCE_PASSWORD=...

# Seed (dev only)
SEED_ADMIN_EMAIL=admin@excellegacy.com
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=...
```

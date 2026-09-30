# RealEstateCRM — Unified Real Estate Operating System

An AI-powered CRM and business operating system for **Excel Legacy Realty Group**, consolidating lead management, marketing automation, content publishing, voice AI, and deal workflows into one platform.

## Architecture

This is the **main dashboard** (ealestatecrm) that hosts the unified UI and serves as the single entry point. Five sub-projects live as git submodules under pps/ and appear as subpages in the dashboard:

| Submodule | Repo | Purpose |
|-----------|------|---------|
| pps/leadg | [leadG](https://github.com/candlestixxx/leadG) | Lead generation & AI outreach |
| pps/contentplanner | [socialmediacontentplanner](https://github.com/candlestixxx/socialmediacontentplanner) | Social content planning & publishing |
| pps/foreclosureworkflow | [forclosureworkflow](https://github.com/candlestixxx/forclosureworkflow) | Pre-foreclosure pipeline automation |
| pps/media-workflow | [re-agent-workflow-media-1](https://github.com/candlestixxx/re-agent-workflow-media-1) | Media production & asset management |
| pps/legacyleads | [LegacyLeads](https://github.com/candlestixxx/LegacyLeads) | Legacy lead data migration & archive |

### AgentCore

The orchestration layer inside this CRM (formerly codenamed "HyperNexus") provides:

- **AI Console** — chat with your data, run workflows, query knowledge base
- **Workflow Builder** — visual automation editor with conditions and triggers
- **Vault** — API key and secret management
- **Lead Routing** — round-robin and rule-based lead distribution
- **AI Qualification** — automatic lead scoring and grading (HOT/WARM/COLD)
- **Voice AI** — outbound calling with ElevenLabs / OpenAI TTS
- **Unified Inbox** — SMS, email, and social messages in one view
- **Publishing Calendar** — schedule and manage social content

## Tech Stack

- **Frontend:** Next.js 15 (App Router) + Tailwind CSS + shadcn/ui
- **Backend:** Next.js API routes + tRPC
- **Database:** SQLite via Prisma ORM
- **Auth:** NextAuth.js
- **AI:** OpenAI GPT-4o-mini, ElevenLabs voice
- **Queues:** BullMQ (Redis)
- **Vector Search:** Pinecone / LanceDB

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm

### Install & Run

`ash
# 1. Clone with submodules
git clone --recurse-submodules https://github.com/candlestixxx/realestatecrm.git
cd realestatecrm

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your database URL, NextAuth secret, and API keys

# 4. Set up database
npx prisma generate
npx prisma db push
npx prisma db seed

# 5. Start development server
npm run dev
`

The app runs at **http://localhost:3000**.

### Seed Data


px prisma db seed creates a demo workspace with:
- 1 workspace (Excel Legacy Realty Group)
- 4 users (Admin, Broker, 2 Agents)
- 11 contacts, 10 leads (varied statuses)
- 2 deals, 8 activities
- 5 SmartPlan templates (pre-foreclosure, buyer drip, FSBO)
- 2 AgentWorkflows (auto-qualify, hot lead alert)
- 2 LeadRoutingRules (Zillow round-robin, referral to broker)

## Project Structure

`
realestatecrm/
├── src/
│   ├── app/              # Next.js App Router pages & API routes
│   │   ├── dashboard/    # Main CRM dashboard UI
│   │   └── api/          # Backend API endpoints
│   ├── components/       # React components
│   └── lib/              # Utilities, Prisma client, RAG, AI helpers
├── prisma/
│   ├── schema.prisma     # Database schema (29 models)
│   └── seed.mjs          # Demo data seeder
├── apps/                 # Git submodules (sub-projects)
│   ├── leadg/
│   ├── contentplanner/
│   ├── foreclosureworkflow/
│   ├── media-workflow/
│   └── legacyleads/
├── docs/                 # Specifications & guides
└── DEPLOY.md             # Deployment instructions
`

## Documentation

| Document | Description |
|----------|-------------|
| [VISION.md](VISION.md) | Product vision & goals |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Development roadmap |
| [docs/PRD.md](docs/PRD.md) | Product requirements |
| [IDEAS_PRESERVATION.md](IDEAS_PRESERVATION.md) | All features across all repos |
| [DEPLOY.md](DEPLOY.md) | Deployment guide |
| [HANDOFF.md](HANDOFF.md) | Agent handoff notes |
| [VERSION.md](VERSION.md) | Current version |

## Key Features

- **Lead Pipeline** — visual kanban with drag-and-drop stages
- **Smart Plans** — automated drip campaigns (email, SMS, call sequences)
- **AgentCore AI** — intelligent lead qualification, routing, and follow-up
- **Voice Workflows** — AI-powered outbound calling scripts
- **Content Studio** — social media planning, brand voice, Canva integration
- **Skip Trace** — phone/email enrichment API
- **Approval Workflows** — multi-step content and deal approvals
- **Asset Export** — bulk export of media and marketing assets
- **Segments** — dynamic lead grouping with filters
- **Deal Tracking** — stakeholders, requirements, milestones

## License

Private — Excel Legacy Realty Group

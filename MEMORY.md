# MEMORY.md — realestatecrm Project Knowledge

## Project Overview
Multi-repo real estate operations & CRM platform (`Excel Legacy Realty Group`) consolidating the main Next.js CRM + 8 specialized sub-projects under `apps/` (12 runtime services total).
- **GitHub Organization:** `RealEstateCRMLLC` (`https://github.com/RealEstateCRMLLC/RealEstateCRM.git`; legacy remotes `robertpelloni/realestatecrm` and `candlestixxx/realestatecrm` resolve to identical history).
- **Parent Workspace Note:** Locally mounted inside `C:\Users\hyper\workspace` (`.git` is a gitfile pointing to `C:/Users/hyper/workspace/.git/modules/realestatecrm`).

## Active Submodules (8 Repos / 12 Runtime Services)
| Path | Repo (`RealEstateCRMLLC/*`) | Local Port(s) | Prod Port / Mount | Description |
|---|---|---|---|---|
| `.` (root) | `RealEstateCRM` | `3000` + WS `8090` | `3210` (`/`) | Main CRM console, Prisma DB, unified RAG, `/trust-services`, `/trust-course`, `/portal` |
| `apps/leadg` | `leadG` | `3001` | `3211` (`/leadg/`) | VoiceForge AI outbound calling, Riley Vapi SDK, campaigns, A/B testing |
| `apps/foreclosureworkflow` | `forclosureworkflow` | `3002` | `3212` (`/foreclosure/`) | Macomb/Bay County foreclosure notice parser + tax-assessor prefill |
| `apps/contentplanner` | `socialmediacontentplanner` | `3003` (web), `3031` (API) | `3213` (`/contentplanner/`), `3216` (`/contentplanner-api/`) | Turborepo social content studio, brand kits, video/podcast pipeline, analytics |
| `apps/media-workflow` | `re-agent-workflow-media-1` | `3004` | `3214` (`/media-workflow/`) | Photo storyboard, AI compliance & FFmpeg promo video studio |
| `apps/legacyleads` | `LegacyLeads` | `3005` (web), `3006` (API) | `3215` (`/legacyleads/`), `3217` (`/legacyleads-api/`) | Property search, batch skip-tracing, Mapbox, TCPA compliance |
| `apps/aicrm` | `aicrm` | `3007` | `3216` (pending nginx) | Standalone AI-first CRM with funnels, pipelines & HyperNexus kernel chat |
| `apps/leadcaller` | `realestateleadcaller` | `3008` | `3217` (pending nginx) | Autonomous real-estate concierge & Twilio/Vapi/SendGrid calling workflows |
| `apps/prototype` | `realestateprototype` | `3009` | sandbox | Universal business-tool rapid feature sandbox (Express API + client) |

## Consolidated Dashboard Architecture (v0.63.7)
- **Command Center (`src/components/dashboard/CommandCenter.tsx`):** Single-page executive console supporting **All-in-One Page** mode (all 9 value-ordered sections rendered on one scrollable page) + **Focused Section** mode, instant keyword search, live 6-card Executive KPI Strip (`/api/reporting`), localhost-aware Sub-Project links (`http://localhost:3001..3009`), and TSF Master Bundle (`/trust-services`).
- **Inline Settings Console (`src/app/dashboard/settings/page.tsx` + `SettingsTabs.tsx`):** Renders all 10 settings panels directly inline (`integrations`, `ai-models`, `voice`, `email`, `branding`, `team`, `routing`, `ai-memory`, `mcp`, `folders`) synced with `?tab=`, while keeping standalone deep routes working.
- **Unified Marketing & Funnels Hub (`src/app/dashboard/marketing/page.tsx`):** Single-page tabbed hub (`?tab=studio|text-codes|funnels`) uniting `MarketingStudioPage`, `<TextCodes />`, and Public Lead Funnels (`/trust-services`, `/trust-course`, `/portal`).
- **12-Service Health (`src/app/api/system/health/route.ts` + `ServiceHealthGrid.tsx`):** Server-side loopback TCP probe across all 12 ports (replaces client-side `fetch('/leadg/')` which falsely reported HTTP 404s as `'up'` on localhost).

## Prisma Schema Gotchas
- Contact: `firstName`/`lastName` (NOT `name`), `address` (no city/zip)
- Lead: `tags` (comma-separated string), `source`/`status` are free-form strings, NO `notes` field
- Lead has `contact` relation (include for contact data)
- Activity: capitalized model name, `content` field (not `description`)
- Task: `assignedToId` (not `userId`), `status` field (not `completed`, `'DONE'` = completed)
- BlogPost: `isPublished` boolean (NOT `published`)
- MyPlusLeadsIntegration: compound unique `workspaceId_email` (use `findFirst({ where: { workspaceId } })`, NOT `findUnique`)
- No `email_workspaceId` compound unique on Contact — use `findFirst` + `create`
- BrandKit is `contentplanner`-only (not in main CRM)

## Code & Tooling Patterns
- `tsconfig.json` excludes `["node_modules", "apps", "archive", "scripts/archive"]` so root `tsc --noEmit` only checks the main CRM instead of crawling all 8 submodules.
- `scripts/system-tray.ps1` MUST remain pure ASCII for Windows PowerShell 5.1 compatibility; uses a single `netstat -ano` port-map pass per 10s tick and `[TrayNative]::DestroyIcon` to prevent Win32 GDI handle leaks.
- `scripts/muse-cdp.js` is the consolidated Edge CDP helper (`--list`, `--read [chars]`, `--inspect`, `--nav <url>`, `"<msg>"`, `--tab <id>`).
- Next.js App Router cannot do WebSocket upgrades — standalone `scripts/live-audio-server.mjs` runs on port `8090`.

## RAG & LLM Architecture
- **RAG Unification:** Consolidated solely in `src/lib/rag.ts` (`rag-sync.ts` merged and removed). Auto-detects Pinecone when `PINECONE_API_KEY` is present.
- **LLM Provider (DeepSeek V4):** Chat/parse/qualify calls use `src/lib/ai/deepseek.ts` + `apps/leadg/src/lib/ai/llm.ts` (`deepseek-v4-flash` default, `deepseek-v4-pro` override; keep `max_tokens >= 4096` for reasoning tokens; use `mode: 'json'` rather than `json_schema`).
- **OpenAI:** Retained for RAG vector embeddings (`src/lib/rag.ts`) and voice TTS/STT (`src/lib/voice.ts`).

## Process Priority & Data Retention Rules
- **BelowNormal Priority:** Every heavyweight build, test, launcher (`build-all.ps1`, `start-all.ps1`, `watch-services.ps1`, `system-tray.ps1`) runs child processes at `BelowNormal` priority (Linux: `scripts/with-low-priority.sh`).
- **Data Retention:** Track non-sensitive session, memory, and local SQLite databases (`dev.db`, `prisma/dev.db`, `.hypernexus*`, `.tormentnexus*`, `data/*.json`); NEVER commit `.env*` secret files (`apps/leadg/.env.production.local` stays untracked).

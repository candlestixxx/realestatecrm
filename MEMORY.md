# MEMORY.md — realestatecrm Project Knowledge

## Project Overview
Multi-repo real estate CRM consolidating 9 sub-projects as dashboard sub-pages via git submodules under `apps/`. GitHub user: `candlestixxx`.

## Active Submodules (5)
| Path | Repo | Description |
|---|---|---|
| `apps/leadg` | leadG | Voice agent (campaigns, calls, A/B testing) |
| `apps/contentplanner` | socialmediacontentplanner | Content studio (AI generation, billing, social) |
| `apps/foreclosureworkflow` | forclosureworkflow | Foreclosure monitoring + tax assessors |
| `apps/media-workflow` | re-agent-workflow-media-1 | Media pipeline + AI compliance |
| `apps/legacyleads` | LegacyLeads | Skip-tracing, Mapbox, TCPA |

## Archived (features merged): aicrm, realestateleadcaller, realestateprototype

## Prisma Schema Gotchas
- Contact: `firstName`/`lastName` (NOT `name`), `address` (no city/zip)
- Lead: `tags` (comma-separated string), `source`/`status` are free-form strings, NO `notes` field
- Lead has `contact` relation (include for contact data)
- Activity: capitalized model name, `content` field (not `description`)
- Task: `assignedToId` (not `userId`), `status` field (not `completed`)
- No `email_workspaceId` compound unique on Contact — use findFirst + create
- BrandKit is contentplanner-only (not in main CRM)
- Named Prisma relations required when Contact has multiple relation types

## Code Patterns
- npm install requires `--legacy-peer-deps`
- PowerShell here-strings corrupt TS template literals — use `write`/`filesystem_write_file`
- JSX template literals corrupted by Write tool — use `'$' + value` concatenation
- contentplanner AI imports relative to `src/` (`./providers` not `../providers`)
- `AIProvider.generateStructuredResponse<T>(prompt, schema)` (NOT `.generate()`)
- Full-project `tsc --noEmit` times out — use `Select-String` path filters
- Next.js App Router cannot do WebSocket upgrades — standalone WS servers required

## Architecture Decisions
- WebSocket live audio: standalone `scripts/live-audio-server.mjs` port 8090
- Audit trail: Activity model with JSON content (no separate table)
- Offline sync: IndexedDB mutation queue, MAX_RETRIES=5
- SendGrid API preferred over SMTP (fallback chain)
- A/B variant assignment: weighted picker (was hardcoded 50/50)
- Syndication: min 5-sample privacy threshold
- AI compliance: 6 check categories (fair housing, FTC, misleading, quality, brand, captions)

## RAG Architecture
- RAG consolidated into `src/lib/rag.ts` (rag-sync.ts merged and removed)
- Uses fallback Pinecone / OpenAI Hosted Vector DB before launch

## Key Routes Index
| Route | Purpose |
|---|---|
| `/api/uploads` | AWS S3 presigned upload |
| `/api/folder-detection` | Magic byte file type detection |
| `/api/data-quality` | Contact completeness scoring |
| `/api/scoring` | Predictive lead scoring |
| `/api/objections` | RAG objection handling |
| `/api/gamification` | Points/achievements |
| `/api/voice/accent-morphing` | Accent profiles + TTS |
| `/api/avatar` | DeepFake avatar sessions |
| `/api/canva` | Brand kit application |
| `/api/agentcore/voice-command` | NL voice commands |
| `/api/syndication` | Cross-tenant market trends |
| `/api/lead-gen/social` | HubSpot/Salesforce sync |
| `/api/contracts` | Blockchain smart contracts |
| `/api/campaigns/ab-test` | A/B test analytics |
| `/api/audit` | Audit trail |

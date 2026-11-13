# Libraries & Submodules

This document lists the major libraries, frameworks, and submodules used in the RealEstateCRM project, along with their purpose and version.

## Core Framework & Language

| Library | Version | Purpose |
| :--- | :--- | :--- |
| **Next.js** | `16.2.6` | React framework for the App Router, Server Actions, and API routes. |
| **React** | `19.2.4` | UI library. |
| **TypeScript** | `^5` | Type-safe JavaScript. |

## Data & Backend

| Library | Version | Purpose |
| :--- | :--- | :--- |
| **Prisma** | `^6.14.0` | ORM for database access and schema management. |
| **Zod** | `^4.4.3` | Schema validation for API inputs and Server Actions. |
| **SQLite** | (Internal) | Local development database. |

## Authentication

| Library | Version | Purpose |
| :--- | :--- | :--- |
| **NextAuth.js** | `^4.24.14` | Authentication framework. |
| **@next-auth/prisma-adapter** | `^1.0.7` | Prisma adapter for NextAuth. |
| **Nodemailer** | `^7.0.13` | Sending magic link emails. |

## AI & RAG

| Library | Version | Purpose |
| :--- | :--- | :--- |
| **Vercel AI SDK (ai)** | `^6.0.177` | Tools for building AI applications and streaming responses. |
| **@ai-sdk/openai** | `^3.0.63` | OpenAI provider for the Vercel AI SDK. |
| **@ai-sdk/react** | `^3.0.179` | React hooks for the AI SDK. |

## UI & Styling

| Library | Version | Purpose |
| :--- | :--- | :--- |
| **Tailwind CSS** | `^4` | Utility-first CSS framework. |
| **@tailwindcss/postcss** | `^4` | PostCSS plugin for Tailwind. |
| **react-hot-toast** | `^2.6.0` | Toast notifications for user feedback. |

## Development & Tooling

| Library | Version | Purpose |
| :--- | :--- | :--- |
| **ESLint** | `^9` | Pluggable linting utility. |
| **Prettier** | `^3.8.3` | Opinionated code formatter. |


## 0.39.0 Audit
- Confirmed versions for major dependencies: Next.js (16.2.6), React (19.0.0), Tailwind CSS (3.4.1), Prisma (6.19.3), NextAuth.js (4.24.11).

## Git Submodules — Structural Map (verified 2026-11-12, v0.63.7)

| Path | Remote URL (`RealEstateCRMLLC/*`) | Pinned Commit | Branch | Local Port(s) & Role |
| :--- | :--- | :--- | :--- | :--- |
| `apps/leadg` | `https://github.com/RealEstateCRMLLC/leadG.git` | `4648a7c` | `main` | `:3001` — VoiceForge outbound calling, Riley Vapi SDK & A/B testing |
| `apps/foreclosureworkflow` | `https://github.com/RealEstateCRMLLC/forclosureworkflow.git` | `357b3eb` | `main` | `:3002` — County foreclosure notice parser + BS&A tax-assessor prefill |
| `apps/contentplanner` | `https://github.com/RealEstateCRMLLC/socialmediacontentplanner.git` | `84aef5a` | `main` | `:3003` (web), `:3031` (API) — Turborepo social studio, brand kits & analytics |
| `apps/media-workflow` | `https://github.com/RealEstateCRMLLC/re-agent-workflow-media-1.git` | `3e5603c` | `main` | `:3004` — Photo storyboard, AI compliance & FFmpeg promo video studio |
| `apps/legacyleads` | `https://github.com/RealEstateCRMLLC/LegacyLeads.git` | `d890579` | `main` | `:3005` (web), `:3006` (API) — Property search, batch skip-tracing & TCPA |
| `apps/aicrm` | `https://github.com/RealEstateCRMLLC/aicrm.git` | `0054988` | `main` | `:3007` — Standalone AI-first CRM with funnels & HyperNexus kernel chat |
| `apps/leadcaller` | `https://github.com/RealEstateCRMLLC/realestateleadcaller.git` | `12f988b` | `main` | `:3008` — Autonomous real-estate concierge & Twilio/Vapi calling workflows |
| `apps/prototype` | `https://github.com/RealEstateCRMLLC/realestateprototype.git` | `6990db1` | `main` | `:3009` — Universal business-tool rapid feature sandbox server |

> Root repository: `https://github.com/RealEstateCRMLLC/RealEstateCRM.git` (identical commit lineage with `robertpelloni/realestatecrm` and `candlestixxx/realestatecrm`). All 8 submodules are active and tracked in `.gitmodules`.

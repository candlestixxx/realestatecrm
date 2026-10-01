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

## Git Submodules — Structural Map (verified 2026-10-01, v0.53.0)

| Path | Remote URL | Pinned Commit | Branch | Status |
| :--- | :--- | :--- | :--- | :--- |
| `apps/leadg` | https://github.com/candlestixxx/leadG.git | `d592b04` | `main` | Active — Voice agent (campaigns, calls, A/B testing) |
| `apps/contentplanner` | https://github.com/candlestixxx/socialmediacontentplanner.git | `a5c2028` | `main` | Active — Content studio (AI generation, billing, social) |
| `apps/foreclosureworkflow` | https://github.com/candlestixxx/forclosureworkflow.git | `9e1dca0` | `main` | Active — Foreclosure monitoring + tax assessors |
| `apps/media-workflow` | https://github.com/candlestixxx/re-agent-workflow-media-1.git | `15cf986` | `main` | Active — Media pipeline + AI compliance |
| `apps/legacyleads` | https://github.com/candlestixxx/LegacyLeads.git | `08cd887` | `main` | Active — Skip-tracing, Mapbox, TCPA |

### Archived Submodules (removed from .gitmodules 2026-06-10; features fully merged)

| Path | Remote URL | Last Commit | Status |
| :--- | :--- | :--- | :--- |
| `apps/aicrm` | https://github.com/candlestixxx/aicrm.git | `58b5337` | Archived — MCP, NL commands, workflow engine ported to main CRM |
| `apps/leadcaller` | https://github.com/candlestixxx/realestateleadcaller.git | `9eb331e` | Archived — merged into leadG |
| `apps/prototype` | https://github.com/candlestixxx/realestateprototype.git | `f561af8` | Archived — merged into contentplanner |

> Root repository: https://github.com/robertpelloni/realestatecrm.git (resolves to candlestixxx/realestatecrm). Not a fork — no upstream parent.

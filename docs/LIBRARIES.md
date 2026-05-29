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

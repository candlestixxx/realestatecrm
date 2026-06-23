# Excel Legacy Real Estate CRM - Final Client Handoff

Welcome to the **Excel Legacy Real Estate CRM**, a highly advanced, multi-tenant application powered by Next.js, Prisma, and integrating cutting-edge AI capabilities.

## Overview
This platform acts as both an internal Customer Relationship Management (CRM) tool for agents, and an external Multi-Tenant website builder for public-facing real estate lead capture.

### Core Systems
1. **CRM Dashboard:** Complete management suite for Deals, Leads, Contacts, and Workflow Pipelines.
2. **AI & Automation:** Seamless integration with OpenAI / Vercel AI SDK for Chat Widgets, conversational logic, and data synchronization.
3. **Multi-Tenant Architecture:** A unique `/(websites)/[domain]` route group managed by a custom Next.js `src/proxy.ts` middleware. Agents can design custom Landing Pages inside the CRM, which dynamically deploy on customized subdomains.
4. **Integration Testing:** Verified sync pipelines with Lofty and MyPlus data bridges using Node's native test runner (`node:test`).

### Deployment Instructions
The application includes a `deploy.sh` script to streamline deployment to production servers via PM2.

```bash
# Verify the application runs
npm ci --legacy-peer-deps
npx prisma db push
npm run build
npm start &
```

### Environment Variables
A `.env.example` file is included detailing the required configuration keys for NextAuth, the Database, OpenAI, and Twilio/Resend integrations. Be sure to configure `.env` before running the system.

Thank you for choosing this platform. All integration tests are completely green.

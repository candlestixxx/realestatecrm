# Deployment & Environment Checklist

This document details the checklist required to take the Excel Legacy Realty CRM into staging and production safely.

---

## 1. Environment Configuration

Before deploying, ensure the production environment is populated with the variables listed in `.env.example`.

### Required Production Secrets:
- **`DATABASE_URL`**: Must point to a production-ready PostgreSQL instance (do not use SQLite in production).
- **`NEXTAUTH_URL`**: Must be the canonical public URL (e.g., `https://crm.excellegacy.com`).
- **`NEXTAUTH_SECRET`**: A cryptographically secure random string.
- **`EMAIL_SERVER` & `EMAIL_FROM`**: Required to send magic link logins for the Client Portal.
- **`OPENAI_API_KEY`**: Required for the Global AI Assistant to function.

### Optional / Feature-Specific:
- **`PINECONE_API_KEY` & `PINECONE_INDEX_HOST`**: Required for Vector-based AI RAG Memory. If omitted, the system falls back to a local JSON manifest approach.

---

## 2. Database & Migration Readiness

1. **Verify Prisma Target:** Ensure your `.env` specifies a Postgres URL, and execute:
   ```bash
   npx prisma generate
   ```
2. **Apply Migrations:**
   ```bash
   npx prisma migrate deploy
   ```
3. **Database Seeding:**
   The staging/production environment requires an initial Owner/Admin account to bootstrap. You can supply `SEED_ADMIN_EMAIL`, `SEED_ADMIN_USERNAME`, and `SEED_ADMIN_PASSWORD` to automatically bootstrap the primary `excel-legacy-team` workspace upon the first run of `npx prisma db seed`.

---

## 3. Build & Next.js Readiness

1. **Lint Check:**
   Execute `npm run lint`. Ensure no `eslint` errors prevent compilation.
2. **Production Compilation:**
   Execute `npm run build`.
   *Note: Next.js will aggressively execute static generation. It is critical that your database is reachable during the build phase if you have any static paths requiring data fetches.*
3. **Start Server:**
   Execute `npm start`.

---

## 4. Security & Compliance Guardrails

Before clearing the deployment for general use, perform the following verification:

- [ ] **Workspace Isolation:** Log in as a newly created user and verify you cannot access records belonging to the default `excel-legacy-team` workspace.
- [ ] **Role Hierarchy Boundary:** Ensure a user with a standard `REALTOR_AGENT` role cannot access features explicitly locked behind the `BROKER` or `OWNER` requirement (e.g., Workflow submission execution).
- [ ] **Demo Credentials Disabled:** Ensure that `AUTH_DEMO_EMAIL` and `AUTH_DEMO_PASSWORD` are **not** present in the production `.env`. Leaving these active allows bypass logic explicitly designed for local staging.
- [ ] **Secret Leakage:** Ensure no API keys or access tokens are hardcoded directly in the `/src` repository files.

---

## 5. Media Pipeline Caveats

If deploying the **Marketing Media Pipeline**:
- The UI currently displays a mock/simulated "Source Directory" local file share path (`\\\\excelserver\\WeichertShare...`).
- When transitioning to a production cloud host (like Vercel), direct SMB/network file share access will fail. You must configure an S3 bucket or equivalent cloud-storage mounting solution for the Next.js runtime to process raw listing photography if automated asset fetching is intended.

# Project 04 — Deployment Path + Environment Checklist

## Purpose
Prepare the project for staging/production deployment with a clear, repeatable checklist and minimal surprises. This project should make deployment safer, more predictable, and easy to hand off.

## Main objectives
- confirm environment variables
- confirm auth and workspace scoping in the target environment
- confirm build and lint pass
- confirm database and migration readiness
- confirm local fallback artifacts do not leak into production
- confirm the app can be deployed with confidence

## Checklist areas
### 1) Environment variables
Audit and document required env vars for:
- auth
- database
- RAG/vector sync
- any external integrations
- any media pipeline integrations
- analytics/pixels only as config, not hard-coded secrets

### 2) Database readiness
- verify Prisma schema status
- identify any pending migrations
- confirm seed strategy for staging
- confirm workspace seed alignment
- confirm fallback behavior if DB is unavailable in local dev

### 3) Build readiness
- run lint
- run production build
- fix any route/type/build regressions
- confirm Next.js routes compile cleanly

### 4) Security readiness
- verify auth protection on protected routes
- verify server-side workspace access enforcement
- verify no secrets are stored in code
- verify public-facing routes remain intentional

### 5) Media/pipeline readiness
If the media pipeline exists or is being deployed alongside the CRM, confirm:
- local file share assumptions are documented
- browser-automation steps are clearly marked
- manual review gates remain in place
- external tool credentials are not embedded in source

## Implementation tasks
1. Inspect current docs (`VERSION.md`, `CHANGELOG.md`, `HANDOFF.md`, `TODO.md`) and identify deployment notes that need consolidation.
2. Create or update a deployment checklist document in the repo.
3. Document environment variables with safe placeholders.
4. Document staging vs production expectations.
5. Verify build/lint and note any known caveats.
6. If useful, add scripts or notes that make deployment repeatable.
7. Do not change product behavior unless deployment requires a small fix.

## Guardrails
- Never write real credentials into files.
- Keep fallback/dev friendliness intact.
- Do not weaken auth/compliance protections just to make deployment easier.
- Avoid broad refactors unrelated to deployment.

## Acceptance criteria
- A clear deployment checklist exists.
- Required environment values are documented.
- Build/lint status is known and recorded.
- Deployment risks are listed plainly.
- The app remains stable after any small fixes needed for readiness.

## Output required from Jules
- A deployment checklist summary.
- Any scripts or docs changed.
- Known staging/production differences.
- A clear pass/fail statement for readiness.

## Stop condition
Stop after this project is complete. Do not continue into another feature branch automatically.

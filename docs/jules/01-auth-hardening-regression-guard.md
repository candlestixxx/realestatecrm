# Project 01 — Auth Hardening Regression Guard

## Purpose
Validate and, only if needed, complete hard auth/tenant/workspace enforcement for the RealEstateCRM app. This project is already largely implemented in the current codebase, so the goal here is to **verify existing protections, fix regressions, and make the system stable** rather than redesign the whole auth layer.

## What success looks like
- Dashboard, CRM, workflow, portal, and relevant API routes remain protected.
- Authenticated users are scoped to their workspace/tenant server-side.
- Client-supplied workspace values are never trusted for authorization.
- List/detail views and create/update actions only access records in the active workspace.
- Demo/local fallback still works without a production database.
- The app continues to pass lint and build.

## Scope
Check and harden these areas:
- `middleware.ts`
- `src/lib/auth.ts`
- `src/lib/workspace-access.ts`
- `src/lib/workspace-context.ts`
- `src/app/api/chat/route.ts`
- `src/app/api/crm-records/*`
- `src/app/(dashboard)/*`
- `src/app/workflows/*`
- `src/types/next-auth.d.ts`
- `prisma/schema.prisma`
- `prisma/seed.ts`

## Implementation loop
1. Inspect the current auth and workspace access flow.
2. Confirm the protected route list includes all sensitive app surfaces.
3. Confirm detail queries use workspace-scoped lookups.
4. Confirm server actions and API routes call the shared workspace access helper.
5. Fix any gaps with the smallest safe change.
6. Run lint and production build.
7. If a test fails, patch the root cause and rerun.

## Guardrails
- Do not weaken existing route protection.
- Do not trust raw client workspace IDs.
- Do not remove demo fallbacks unless replacing them with an equivalent fallback-safe path.
- Keep TypeScript compatibility intact.
- Do not break the current mobile or dashboard experience.
- Do not introduce secrets or environment values into source code.

## Acceptance criteria
- Auth-protected routes redirect unauthenticated users to sign-in.
- Workspace access is resolved server-side.
- CRM and workflow screens remain scoped to the active workspace.
- The code builds cleanly.
- No regressions are introduced in existing local/demo flows.

## Output required from Jules
- A short summary of what was validated or changed.
- A list of files touched.
- Any remaining risks or follow-up items.
- Confirmation that lint/build passed.

## Stop condition
Stop after this project is complete. Do not begin the next project automatically.

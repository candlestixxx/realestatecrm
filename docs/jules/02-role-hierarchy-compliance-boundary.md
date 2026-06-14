# Project 02 — Role Hierarchy + Compliance Boundary

## Purpose
Build a formal role hierarchy and compliance boundary for the platform so the system can support:
- Owner
- Broker
- Associate Broker
- Realtor Agent
- Office Manager
- Admin

The owner should retain broad operational control in the UI, while the backend still enforces hard compliance boundaries for law, licensing, consent, audit, and workspace access.

## Desired architecture
- **Frontend:** role-aware visibility, clear controls, and convenience.
- **Backend:** the hard wall for legal and compliance rules.
- **Owner:** broad high-level control over business configuration and approvals.
- **Compliance:** never bypassed by UI actions.

## Required behavior
### Role ordering
1. Owner
2. Broker
3. Associate Broker
4. Realtor Agent
5. Office Manager
6. Admin

### Role responsibilities
- **Owner:** strategic control, settings, templates, approval override where legally allowed.
- **Broker:** operational supervision, listing approval, brokerage-level review.
- **Associate Broker:** elevated production permissions with limited supervisory control.
- **Realtor Agent:** daily CRM, leads, tasks, listings, and communication tools.
- **Office Manager:** operational admin, scheduling, coordination, folder/workflow support.
- **Admin:** system management, user setup, integrations, and technical administration.

## Compliance boundary requirements
The backend must hard-enforce:
- advertising rules
- broker name/display rules
- agency disclosure gating
- consent and opt-out requirements
- audit logging
- workspace/tenant boundaries
- fair housing-safe messaging
- data minimization and privacy-safe handling
- approval requirements for public publishing

## UI requirements
- Role-based dashboards and navigation.
- Clear role badges and permission states.
- Owner controls should feel broad but still visually distinct from legal/compliance gates.
- Approval states should be obvious: Draft / Review / Approved / Published.
- Compliance warnings should be visible, readable, and actionable.

## Implementation tasks
1. Review the current auth/session role model.
2. Define a canonical role enum or role mapping.
3. Create or update a permission matrix for app actions.
4. Apply role checks to relevant server actions and API routes.
5. Update UI screens to hide or disable actions by role where appropriate.
6. Add approval/compliance status indicators where content is generated or published.
7. Ensure the owner can configure business settings broadly, while backend compliance cannot be bypassed.
8. Run lint and build, then fix any type or route regressions.

## Files likely involved
- `src/lib/auth.ts`
- `src/lib/workspace-access.ts`
- `src/types/next-auth.d.ts`
- `middleware.ts`
- `prisma/schema.prisma`
- dashboard/CRM/workflow pages
- server actions and API routes

## Guardrails
- Do not let UI state override backend law/compliance enforcement.
- Do not remove workspace scoping.
- Do not hard-code business workflows that should remain configurable.
- Keep the UI luxury, readable, and simple.
- Keep all secrets out of the repo.

## Acceptance criteria
- Roles exist and are used consistently.
- Actions are visible/hidden/blocked appropriately by role.
- Compliance-sensitive actions require the proper approval path.
- The owner has broad control without bypassing hard legal rules.
- The app still builds and behaves cleanly across mobile and desktop.

## Output required from Jules
- Summary of role/permission model.
- Files changed.
- Any follow-up recommendations.
- Proof that lint/build passed.

## Stop condition
Stop after this project is complete. Do not start the marketing pipeline or deployment work automatically.

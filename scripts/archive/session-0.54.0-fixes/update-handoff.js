/**
 * Prepend the v0.54.0 session summary to HANDOFF.md.
 */
const fs = require('fs');
const path = require('path');

const section = `# HANDOFF.md — Multi-Agent Session Handoff

> **Current state: v0.54.0. Every component installs and builds green. Root server healthy on :3000.**
> Previous session details: \`SESSION_HANDOFF_2026-06-10.md\` (v0.52.0 features).

## Session Summary (2026-10-01, continued) — Build Repair Across All Submodules

### What was done
Following the v0.53.0 repo sync and the v0.53.1/v0.53.2 UI + tooling work, this
pass made the five \`apps/*\` submodules actually build. Previously only the root
Next.js app compiled; every submodule had never had \`npm install\` run and all
of them failed to build.

| Submodule | State before | State now |
|---|---|---|
| \`apps/leadg\` | no deps; build failed on 6 distinct issues | **builds green** |
| \`apps/foreclosureworkflow\` | no deps installed | **builds green** (needed no source changes) |
| \`apps/contentplanner\` | 97 tsc errors; web build failed 4 ways | **builds green** (turbo: 2/2 tasks) |
| \`apps/media-workflow\` | 1 tsc error; dist/ self-overwrite | **builds green** (Vite + tsc) |
| \`apps/legacyleads\` | no deps; 3 missing modules | **builds green** (Next.js + tsc) |

### Root causes worth remembering
Two failure classes came up repeatedly and are worth knowing before the next
session touches this tree:

1. **Node module resolution climbs to the parent monorepo.** contentplanner is
   nested inside realestatecrm. When a package is missing locally, Node walks
   up and silently picks up realestatecrm's copy — with the *wrong* contents.
   This bit twice:
   - \`@next/swc-win32-x64-msvc\` resolved to realestatecrm's 16.2.6 binary while
     contentplanner runs Next 15.2.1. Symptom: "data did not match any variant
     of untagged enum Config".
   - \`@prisma/client\` resolved to realestatecrm's client (models
     \`Lead\`/\`Contact\`/\`SmartPlan\`) while contentplanner needs
     \`Post\`/\`Campaign\`/\`BrandKit\`.
   Fix both times: install the package at the nested workspace root so it wins
   resolution.

2. **Next.js route files may only export HTTP methods.** \`export const
   authOptions\` from \`app/api/auth/[...nextauth]/route.ts\` fails the build.
   Hit in both leadg and contentplanner. Fix: move the options to
   \`src/lib/auth.ts\`, leave the route importing from there.

Also: PostgreSQL on this host is on **port 5433** (service
\`postgresql-x64-18\`), not 5432. contentplanner's \`.env\` files now say 5433.
The \`contentcommand\` database credentials are still unverified — the app falls
back to its MockPrismaClient when the real server refuses the connection.

### Prisma schema change (contentplanner)
\`Workspace\` gained \`plan\`, \`subscriptionStatus\`, and \`stripeCustomerId\`.
The Stripe webhook in \`packages/billing\` had been writing these against a
nonexistent \`Organization\` model. All \`prisma.organization\` calls are now
\`prisma.workspace\`. **This needs \`npx prisma db push\` once database
credentials are confirmed** — the client is generated from the new schema, but
the tables have not been altered yet.

### Submodule commits pushed
- \`apps/leadg\` @ \`9125157\`
- \`apps/foreclosureworkflow\` @ \`01f08c3\`
- \`apps/contentplanner\` @ \`3b2238f\`
- \`apps/media-workflow\` @ \`275bb27\`
- \`apps/legacyleads\` @ \`b4fcd6f\`

### Known gaps carried forward
- **No system tray / desktop shell exists.** The app is pure Next.js.
  \`scripts/system-tray.ps1\` (v0.53.2) is a Windows tray controller and
  \`scripts/kill-port.js\` stops the server; neither is a real always-on tray
  icon with quit-server semantics. Building one means an Electron/Tauri/pystray
  wrapper.
- **Many API pages hardcode \`workspaceId=excel-legacy-team\`** — latent
  multi-tenant bug.
- **\`live-audio-server.mjs\`** (WebSocket for WebRTC call monitoring) has not
  been started this session.
- **contentplanner lint is non-blocking** (\`eslint.ignoreDuringBuilds: true\`).
  \`npm run lint\` still reports; the codebase was never lint-clean.

`;

const handoffPath = path.join(__dirname, 'HANDOFF.md');
let existing = fs.readFileSync(handoffPath, 'utf8');
// Drop the old leading H1 + status block so we don't stack duplicate headers.
existing = existing.replace(/^# HANDOFF\.md[\s\S]*?(?=^## )/m, '');
fs.writeFileSync(handoffPath, section + existing);
console.log('HANDOFF.md updated');

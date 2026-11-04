/**
 * Version bump to 0.54.0 — all-submodule build repair release.
 * Syncs VERSION.md / package.json / package-lock.json and prepends CHANGELOG.
 */
const fs = require('fs');
const path = require('path');

const VERSION = '0.54.0';
const root = __dirname;

fs.writeFileSync(path.join(root, 'VERSION.md'), VERSION + '\n');
console.log('VERSION.md ->', VERSION);

const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.version = VERSION;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log('package.json ->', VERSION);

const lockPath = path.join(root, 'package-lock.json');
if (fs.existsSync(lockPath)) {
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  lock.version = VERSION;
  if (lock.packages && lock.packages['']) lock.packages[''].version = VERSION;
  fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');
  console.log('package-lock.json ->', VERSION);
}

// Prepend the changelog entry.
const entry = `## [${VERSION}] - 2026-10-01

### Build Repair Across All Submodules
Every component now installs and builds green. Root \`npm run build\` and the
production server were already healthy; this release makes the five \`apps/*\`
submodules match.

- **leadg** — installed undeclared deps (\`leaflet\`, \`react-leaflet\`,
  \`@hello-pangea/dnd\`, \`inngest\`, \`@sendgrid/mail\`, \`@twilio/voice-sdk\`,
  \`@types/leaflet\`); added \`src/lib/prisma.ts\` re-export (several modules
  imported \`@/lib/prisma\` which never existed); extracted \`authOptions\` to
  \`src/lib/auth.ts\` (Next.js route files may only export HTTP methods) and
  rewrote 13 imports; added NextAuth \`Session.user.id\` augmentation; fixed
  Prisma relation \`agent\` -> \`assignedAgent\`; added required
  \`organizationId\` on \`lead.create\` and required \`CallLog\` fields in the
  vapi webhook; mapped \`CallOutcome\` to real enum values.

- **foreclosureworkflow** — verified install + \`next build\` green (all
  routes compile, including \`/api/sequences/*\` and \`/leads/[id]/edit\`).

- **contentplanner** — repaired 97 strict-mode errors across the turbo
  workspace. Mechanical: \`process.env.X\` -> bracket access, unused
  params/locals, explicit \`return\` on terminal Express responses. Structural:
  \`authOptions\` extracted to \`apps/web/src/lib/auth.ts\` (exporting it from
  the route failed the build with "data did not match any variant of untagged
  enum Config"); billing import path fixed to \`@contentcommand/billing\`;
  \`ioredis\` type identity unified (bullmq bundles 5.10.1, app had 5.11.1);
  \`@next/swc-win32-x64-msvc@15.2.1\` declared so Next stops patching the
  lockfile through a yarn probe that loops; \`@prisma/client\` hoisted to the
  workspace root so resolution stops climbing to the parent monorepo's client
  (wrong schema); \`"use client"\` moved above the React import in
  \`draft-review-modal.tsx\`; Badge gained a \`ghost\` variant. Prisma schema
  extended: \`Workspace\` now carries \`plan\`, \`subscriptionStatus\`,
  \`stripeCustomerId\` — the Stripe webhook wrote these against a nonexistent
  \`Organization\` model, now remapped to \`prisma.workspace\`.
  DATABASE_URL port corrected to 5433.

- **media-workflow** — \`ApprovalWorkflowService.autoApproveJob\` returns
  \`{ job, review }\`; the orchestrator assigned that whole object to a
  \`ListingMediaJob\`. Destructured and the review outcome is now logged.
  \`tsconfig.json\` excludes \`dist/\` (tsc emitted \`.d.ts\` there and the next
  run failed TS5055 "would overwrite input file"). Vite frontend builds clean.

- **legacyleads** — installed \`@mapbox/mapbox-gl-draw\`, \`supercluster\`,
  and their type packages (InteractiveMap.tsx imported them undeclared).
  Next.js frontend builds clean; backend \`tsc --noEmit\` already clean.

### Tooling
- \`scripts/system-tray.ps1\` — Windows tray controller (see 0.53.2).
- One-shot repair scripts kept beside their packages for auditability.

`;

const clPath = path.join(root, 'CHANGELOG.md');
let cl = fs.readFileSync(clPath, 'utf8');
if (!cl.includes(`## [${VERSION}]`)) {
  cl = entry + '\n' + cl;
  fs.writeFileSync(clPath, cl);
  console.log('CHANGELOG.md prepended for', VERSION);
} else {
  console.log('CHANGELOG already has', VERSION);
}

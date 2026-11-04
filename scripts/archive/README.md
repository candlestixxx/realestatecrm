# scripts/archive

One-off, debug, and point-in-time utility scripts moved here during the
2026-10-01 nondestructive cleanup (v0.53.1).

Nothing was deleted. Every script here is preserved verbatim and can be
moved back to `scripts/` if it becomes operationally relevant again.

## Categories

| Category | Scripts | Why archived |
|---|---|---|
| Data checks | `check-*.js`, `check-*.mjs` | One-off DB inspections |
| Record lookups | `find-*.js` | Single-record debug queries |
| Debug tooling | `debug-*.js`, `debug-*.py`, `debug-step.js` | Development debugging |
| One-off migrations | `convert-db-dates-to-text.js`, `reformat-myplus-notes.js` | Already applied |
| One-off restores | `restore-*.js` | Already applied |
| One-off tests | `test-*.js`, `test-*.py` | Superseded by E2E suite |
| One-off data ops | `tag-ben-franklin.mjs`, `trigger-sync.js`, `update-foreclosure-dates*.js`, `import-sync-queue-leads.mjs`, `create-foreclosure-checkpoint-*.js`, `crm-add-notice-notes.py` | Point-in-time operations |

## Active scripts (kept in `../`)

Operational tooling that is still referenced or scheduled:

- `kill-port.js` — cross-platform port liberator (used by package.json hooks)
- `live-audio-server.mjs` — WebSocket server for WebRTC call monitoring
- `sync-myplusleads.ts` — MyPlusLeads CRM sync (`npm run sync:myplus`)
- `start-pilot-and-simulate.sh` — pilot simulation harness
- `run_weekly_macomb_intake.py` — weekly Macomb County foreclosure intake
- `import_legalnews_foreclosures.py` — legal news foreclosure import
- `seed-foreclosure-leads.mjs` — foreclosure lead seeder
- `lofty-*.py` — Lofty CRM integration suite (8 scripts)

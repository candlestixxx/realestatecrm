# Scripts Directory

Organized 2026-06-10. All scripts preserved nondestructively.

## Core Runtime (referenced by package.json)
- `system-tray.ps1` — Windows system tray with Start/Stop/Restart/Quit for all 8 services
- `kill-port.js` — Kills process on a given port (used by predev/prestart)
- `live-audio-server.mjs` — WebSocket server on port 8090 for live audio monitoring
- `sync-myplusleads.ts` — MyPlusLeads CRM sync (run: `npm run sync:myplus`)

## integrations/lofty/
Lofty CRM integration scripts (Python + Node):
- `lofty-full-sync.py` / `lofty-batch-sync.py` / `lofty-sync-leads.py` — Lead sync
- `lofty-add-notes.py` / `lofty-add-notice-notes.py` — Note injection
- `lofty-assign-segment.py` — Segment assignment
- `lofty-search-all.py` / `lofty-update-queue.py` — Search and queue management
- `import-neighborhood-*.mjs` / `assign-neighborhood-segment.mjs` / `finalize-neighborhood-list.mjs` / `add-neighborhood-notes-tags.mjs` — Neighborhood pipeline

## pipelines/foreclosure/
Foreclosure monitoring pipeline:
- `import_legalnews_foreclosures.py` — Legal news scraper
- `run_weekly_macomb_intake.py` — Weekly Macomb/Bay County intake
- `seed-foreclosure-leads.mjs` — Seed data for development

## archive/
Deprecated one-off scripts kept for reference. See `archive/README.md`.

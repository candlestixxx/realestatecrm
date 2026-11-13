# Scripts Directory

Organized nondestructively. All deprecated/one-off scripts are preserved under `scripts/archive/`.

## Core Runtime & Orchestration
- `system-tray.ps1` - Windows system tray controller (`npm run tray`) with live `[ON]`/`[OFF]` status, Start/Stop/Restart, log viewers, and surgical PID-by-port `Quit All Servers and Exit` across all **12** platform services (BelowNormal CPU priority, zero GDI handle leaks).
- `watch-services.ps1` - Background health watchdog polling all 12 service ports every 60s and restarting downed services at BelowNormal priority.
- `kill-port.js` - Health-gated port cleaner used by `predev` / `prestart` (`KILL_PORT_FORCE=1` forces kill even when healthy).
- `live-audio-server.mjs` - Standalone WebSocket server on port `8090` (`/health` HTTP probe) for live audio monitoring.
- `load-default-campaigns.mjs` - Idempotent seeder for the 4 brokerage-wide default buyer/seller Smart Plans.
- `sync-myplusleads.ts` - MyPlusLeads CRM sync (`npm run sync:myplus`).
- `with-low-priority.sh` - Linux/Hetzner `nice -n 10 ionice -c3` wrapper for heavyweight builds/deploys.

## Multi-Agent Coordination & Testing
- `muse-cdp.js` - Unified Edge CDP (`:9222`) coordinator (`--list`, `--read [chars]`, `--inspect`, `--nav <url>`, `"<message>"`, `--tab <id>`). Replaces the 8 one-off variants archived in `archive/muse-cdp-variants/`.
- `e2e-smoke.js` - Cross-service HTTP smoke test suite.
- `load-test.js` - Concurrent endpoint load test runner.

## Branding & Trust Bundle Generators
- `brand-trust-docs.py` / `brand-trust-pdfs.py` / `build-master-bundle.py` - Generators for the TSF Master Bundle (`public/trust-docs/`).

## integrations/lofty/
Lofty CRM integration scripts (Python + Node):
- `lofty-full-sync.py` / `lofty-batch-sync.py` - Lead sync
- `lofty-add-notes.py` / `lofty-add-notice-notes.py` - Note injection
- `lofty-assign-segment.py` - Segment assignment
- `lofty-search-all.py` / `lofty-update-queue.py` - Search and queue management

## pipelines/foreclosure/
Foreclosure monitoring pipeline (47 Python `unittest` parser tests run in CI):
- `import_legalnews_foreclosures.py` + `test_import_legalnews_foreclosures.py` - Legal News foreclosure parser & tests
- `run_weekly_macomb_intake.py` + `test_run_weekly_macomb_intake.py` - Weekly Macomb/Bay County intake & tests

## archive/
Nondestructively preserved historical one-off scripts (`muse-cdp-variants/`, `session-0.54.0-fixes/`, `session-0.63.7-cleanup/`).
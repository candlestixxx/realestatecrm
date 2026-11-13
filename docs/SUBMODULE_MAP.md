# Submodule Structural Map — v0.63.7

> Regenerated 2026-11-12 during Executive Protocol repository synchronization & `RealEstateCRMLLC` organization consolidation. Canonical root map: [SUBMODULE_MAP.md](../SUBMODULE_MAP.md).

## Repositories (Root + 8 Active Submodules)

| Path | Remote URL | Pinned Commit | Branch | Local Port(s) |
|---|---|---|---|---|
| `.` (root) | `https://github.com/RealEstateCRMLLC/RealEstateCRM.git` | `v0.63.7` (`main` HEAD) | `main` | `3000`, `8090` (WS) |
| `apps/aicrm` | `https://github.com/RealEstateCRMLLC/aicrm.git` | `0054988` | `main` | `3007` |
| `apps/contentplanner` | `https://github.com/RealEstateCRMLLC/socialmediacontentplanner.git` | `84aef5a` | `main` | `3003`, `3031` |
| `apps/foreclosureworkflow` | `https://github.com/RealEstateCRMLLC/forclosureworkflow.git` | `357b3eb` | `main` | `3002` |
| `apps/leadcaller` | `https://github.com/RealEstateCRMLLC/realestateleadcaller.git` | `12f988b` | `main` | `3008` |
| `apps/leadg` | `https://github.com/RealEstateCRMLLC/leadG.git` | `4648a7c` | `main` | `3001` |
| `apps/legacyleads` | `https://github.com/RealEstateCRMLLC/LegacyLeads.git` | `d890579` | `main` | `3005`, `3006` |
| `apps/media-workflow` | `https://github.com/RealEstateCRMLLC/re-agent-workflow-media-1.git` | `3e5603c` | `main` | `3004` |
| `apps/prototype` | `https://github.com/RealEstateCRMLLC/realestateprototype.git` | `6990db1` | `main` | `3009` |

## Branch Reconciliation Summary (2026-11-12)

- **Nested Submodules:** None (verified recursively across all 8 submodules).
- **Forward-Merge Audit:** All 23 remote feature branches across root (6) + 8 submodules (17) inspected via `git rev-list --left-right --count main...origin/<branch>`; `0` unmerged commits existed ahead of `main` (prior `gate1/foreclosure-parser-tests` work already merged at `c1e865b`).
- **Reverse-Merge Sync:** All 17 submodule feature branches and 6 root feature branches fast-forwarded to their respective `main` tips, repointed from `legacy/*` to `origin/*` (`RealEstateCRMLLC/*`), and pushed so zero branch drift remains.
- **Conflict Marker Sweep:** Resolved residual `<<<<<<< HEAD` markers in `apps/aicrm` (`.gitignore`, `CHANGELOG.md`, `ROADMAP.md`, `TODO.md`) and `apps/media-workflow` (`.hypernexus-session.json`, `.hypernexus_startup_marker`). Verified `0` conflict markers across all 9 repositories.

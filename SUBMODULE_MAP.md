# SUBMODULE_MAP.md

Auto-generated structural map. Updated 2026-11-12 (`v0.63.7` Executive Protocol sync & dual-direction branch reconciliation).
Root repository: `https://github.com/RealEstateCRMLLC/RealEstateCRM.git` (upstream parity verified against `robertpelloni/realestatecrm` and `candlestixxx/realestatecrm`).

## Summary Matrix

| Submodule Path | Remote URL (`RealEstateCRMLLC/*`) | Pinned Commit (`main`) | Local Port(s) | Feature Branches (All Reverse-Synced to `main`) |
|---|---|---|---|---|
| `apps/aicrm` | `https://github.com/RealEstateCRMLLC/aicrm.git` | `00549886914cb40010bc9ad22a84daa8c82f8038` | `3007` | `jules-3434254056450392757-d9850c0f` |
| `apps/contentplanner` | `https://github.com/RealEstateCRMLLC/socialmediacontentplanner.git` | `84aef5abe07f04dce41e5fd06a326304797a4006` | `3003`, `3031` | `foundation-build-11917896674798314449`, `jules-6504094641305471454-6d1e3af8` |
| `apps/foreclosureworkflow` | `https://github.com/RealEstateCRMLLC/forclosureworkflow.git` | `357b3eb84c468be67c99772fb5503ba47c15cec8` | `3002` | `feat/foreclosure-crm-mvp-9726332118304912403`, `feat/s3-document-upload-17306733181207525663`, `foreclosure-crm-mvp-9726332118304912403` |
| `apps/leadcaller` | `https://github.com/RealEstateCRMLLC/realestateleadcaller.git` | `12f988bc6499dd65ddbe13ce66e1db8f0092b0d3` | `3008` | `jules-2713423736642792031-eb4c9364`, `jules-ai-real-estate-concierge-mvp-8261096991693832942` |
| `apps/leadg` | `https://github.com/RealEstateCRMLLC/leadG.git` | `4648a7cc4198a0188b9910141d823e89b069d556` | `3001` | `main-14181498285415879315` |
| `apps/legacyleads` | `https://github.com/RealEstateCRMLLC/LegacyLeads.git` | `d8905793ab83624bd069efebf217748c29f1865a` | `3005`, `3006` | `jules-initial-setup-9943991237688238805` |
| `apps/media-workflow` | `https://github.com/RealEstateCRMLLC/re-agent-workflow-media-1.git` | `3e5603cd8b02858bec202402673d54e4a641e043` | `3004` | `feature/init-media-pipeline-17967464845567188821`, `init-media-pipeline-17967464845567188821`, `jules-10626851319290360880-c8876b20` |
| `apps/prototype` | `https://github.com/RealEstateCRMLLC/realestateprototype.git` | `6990db160998a37f8c8c60fe376e965d4ba80e53` | `3009` | `jules-588126708554458831-4191ea81`, `jules-8744402723558720108-450957f1`, `master`, `universal-business-tool-ui-16093869491000990216` |

## Detailed Submodule Breakdown

### apps/aicrm (`v0.13.1`)
- **Remote:** `https://github.com/RealEstateCRMLLC/aicrm.git`
- **Commit:** `00549886914cb40010bc9ad22a84daa8c82f8038`
- **Main tip:** `0054988 v0.13.1: RealEstateCRMLLC org refs, resolve conflict markers, track dev.db, port 3007`
- **Branches synced:** `origin/main`, `origin/jules-3434254056450392757-d9850c0f` (0 unique commits unmerged; reverse-synced to `0054988`)

### apps/contentplanner
- **Remote:** `https://github.com/RealEstateCRMLLC/socialmediacontentplanner.git`
- **Commit:** `84aef5abe07f04dce41e5fd06a326304797a4006`
- **Main tip:** `84aef5a fix(build): TS strict index-access + JWT parts undefined - api tsc clean (25 errors)`
- **Branches synced:** `origin/main`, `origin/foundation-build-11917896674798314449`, `origin/jules-6504094641305471454-6d1e3af8` (all at `84aef5a`)

### apps/foreclosureworkflow
- **Remote:** `https://github.com/RealEstateCRMLLC/forclosureworkflow.git`
- **Commit:** `357b3eb84c468be67c99772fb5503ba47c15cec8`
- **Main tip:** `357b3eb fix: pin turbopack.root to repo (stops wrong workspace-root inference)`
- **Branches synced:** `origin/main`, `origin/feat/foreclosure-crm-mvp-9726332118304912403`, `origin/feat/s3-document-upload-17306733181207525663`, `origin/foreclosure-crm-mvp-9726332118304912403` (all at `357b3eb`)

### apps/leadcaller (`v0.6.1`)
- **Remote:** `https://github.com/RealEstateCRMLLC/realestateleadcaller.git`
- **Commit:** `12f988bc6499dd65ddbe13ce66e1db8f0092b0d3`
- **Main tip:** `12f988b v0.6.1: ignore transient logs, track prisma/dev.db, port 3008 dev script`
- **Branches synced:** `origin/main`, `origin/jules-2713423736642792031-eb4c9364`, `origin/jules-ai-real-estate-concierge-mvp-8261096991693832942` (all at `12f988b`)

### apps/leadg
- **Remote:** `https://github.com/RealEstateCRMLLC/leadG.git`
- **Commit:** `4648a7cc4198a0188b9910141d823e89b069d556`
- **Main tip:** `4648a7c fix(build): add missing tailwind/postcss v3 config - fresh next build failed on @tailwindcss/postcss fallback`
- **Branches synced:** `origin/main`, `origin/main-14181498285415879315` (all at `4648a7c`; local `.env.production.local` excluded from git for secret safety)

### apps/legacyleads
- **Remote:** `https://github.com/RealEstateCRMLLC/LegacyLeads.git`
- **Commit:** `d8905793ab83624bd069efebf217748c29f1865a`
- **Main tip:** `d890579 fix(build): remove Windows-only @next/swc-win32 dep`
- **Branches synced:** `origin/main`, `origin/jules-initial-setup-9943991237688238805` (all at `d890579`)

### apps/media-workflow (`v2.16.1`)
- **Remote:** `https://github.com/RealEstateCRMLLC/re-agent-workflow-media-1.git`
- **Commit:** `3e5603cd8b02858bec202402673d54e4a641e043`
- **Main tip:** `3e5603c v2.16.1: RealEstateCRMLLC package metadata and session conflict cleanup`
- **Branches synced:** `origin/main`, `origin/feature/init-media-pipeline-17967464845567188821`, `origin/init-media-pipeline-17967464845567188821`, `origin/jules-10626851319290360880-c8876b20` (all at `3e5603c`)

### apps/prototype
- **Remote:** `https://github.com/RealEstateCRMLLC/realestateprototype.git`
- **Commit:** `6990db160998a37f8c8c60fe376e965d4ba80e53`
- **Main tip:** `6990db1 fix: Express JSON error handler for body-parser (was HTML stack trace)`
- **Branches synced:** `origin/main`, `origin/jules-588126708554458831-4191ea81`, `origin/jules-8744402723558720108-450957f1`, `origin/master`, `origin/universal-business-tool-ui-16093869491000990216` (all at `6990db1`)

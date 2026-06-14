# Google Jules Handoff Index

Use these files one at a time. Each file is self-contained and instructs Jules to work only on that project, run an internal implementation loop, verify the result, and then stop.

## Recommended order
1. `01-auth-hardening-regression-guard.md`
2. `02-role-hierarchy-compliance-boundary.md`
3. `03-marketing-media-pipeline-image-video.md`
4. `04-deployment-path-checklist.md`

## Usage rules for Jules
- Read only the active file for the current run.
- Do not start the next project automatically.
- Implement in a tight loop: inspect → plan → code → test → fix → verify.
- Keep the codebase TypeScript-first and aligned with the existing Next.js/Prisma architecture.
- Preserve the existing branding direction: dark luxury UI with blue/gold accents and high readability.
- Never expose secrets in code or docs.
- When a task is already complete in the repo, validate it and patch regressions instead of rewriting unrelated areas.

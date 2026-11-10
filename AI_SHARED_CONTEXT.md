# AI Shared Context — realestatecrm (all harnesses + browser tabs read this)

> Source of truth for cross-AI coordination. CLI harnesses: read this + HANDOFF.md.
> Browser tabs (ChatGPT/Gemini/Muse): this file is the bootstrap — ask the user to paste it.

## Identity
- Repo: C:\Users\hyper\workspace\realestatecrm, branch main, version 0.62.5
- Prod: Hetzner root@5.161.250.43, /var/www/excellegacyrealtygroup, pm2 excellegacyrealtygroup
- Rule: HETZNER-ONLY. Never start local :3000. Heavy jobs run BelowNormal, child-only.

## Verified state (2026-11-10)
- main @ 38e93a8, package.json 0.62.5. Prod runs v0.62.5b verified.
- v0.62.5b SHIPPED + VERIFIED (HANDOFF entry): deploy-v3.tar.gz 87,596,213 bytes SAFE zero sqlite, MD5 local==remote 36a77fe879123724357b03e7a6f41e89, backup runtime-before-0.62.5b, post-deploy.sh (Prisma symlink + DATABASE_URL), pm2 excellegacyrealtygroup v0.62.5 online.
- Verified: main / 200, /trust-course 200, 8 listings live (EXL-1001..1006 + 2 test rows), 6 TWILIO lines in prod .env, server-err.log empty.
- Trust Course card live in CommandCenter (src/components/dashboard/CommandCenter.tsx) + version label.
- package-v3.py fix committed: never package *.db (caused Nov-8 prod wipe, restored).
- Concurrent lane: opencode hardening src/app/api/workflow-sessions/route.ts (auth + workspace scoping + safeData) — Codex formatted + added missing POST-update workspace guard. Pending commit.

## Next steps (in order)
1. Push local main (3-4 commits incl. capsule + HANDOFF v0.62.5b + workflow-sessions hardening) — run on authenticated machine, pushes stall here.
2. Command Center regroup: Money Now / Marketing / Operations / System hub cards.
3. Toasts + tooltips coverage: only 9/54 dashboard pages mention tooltip.

## Still key-blocked (needs user)
TWILIO_PHONE_NUMBER (upgrade-blocked) | RESEND_API_KEY | MLS_RESO feed+token |
STRIPE $497 keys | attorney review of 6 Trust lessons.

## Coordination protocol
- Memory: HyperNexus L2 (kernel :7778) + this file + HANDOFF.md. If kernel is down,
  this file is the fallback — do not invent history.
- Browser tabs: operator pastes this file as the bootstrap message. No AI types into
  another live tab unasked.
- Identity line for cross-AI messages: [Muse Spark in Codex desktop in
  C:\Users\hyper\workspace\realestatecrm on laptop]

## Operator availability (noted 2026-11-09)
- Morning of 2026-11-10: ACE Car Wash meeting, window 9:00 AM-12:00 PM ET.
- 1:00 PM ET same day: meetup with Rex (business connection).
- Calendar writes unavailable from this Codex session (Google connectors unwired
  here); create events manually or via a connected harness. Confirm exact times.

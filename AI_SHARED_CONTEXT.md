# AI Shared Context — realestatecrm (all harnesses + browser tabs read this)

> Source of truth for cross-AI coordination. CLI harnesses: read this + HANDOFF.md.
> Browser tabs (ChatGPT/Gemini/Muse): this file is the bootstrap — ask the user to paste it.

## Identity
- Repo: C:\Users\hyper\workspace\realestatecrm, branch main, version 0.62.5
- Prod: Hetzner root@5.161.250.43, /var/www/excellegacyrealtygroup, pm2 excellegacyrealtygroup
- Rule: HETZNER-ONLY. Never start local :3000. Heavy jobs run BelowNormal, child-only.

## Verified state (2026-11-09)
- main @ 7e6eab6, tracked tree clean. package.json 0.62.5.
- Prod runs first v0.62.5: / + /trust-course = 200, 8 listings live (EXL-1001..1006 + 2).
- v0.62.5b BUILT, NOT shipped: Trust Course card in CommandCenter + version label.
- deploy-v3.tar.gz scanned SAFE: zero *.db (only cockroachdb/sandbox/font substring hits).
- Upload to /root/deploy-v3-0.62.5b.tar.gz IN FLIGHT (unconfirmed). Next: remote size +
  md5 compare, backup, extract, post-deploy.sh, pm2 restart, verify 200s + listings API.
- package-v3.py fix committed: never package *.db (caused Nov-8 prod wipe, restored).

## Next steps (in order)
1. Confirm upload, ship v0.62.5b, verify prod, HANDOFF entry, push.
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

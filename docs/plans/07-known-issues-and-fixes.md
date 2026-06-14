# 07 — Known Issues & Fixes

## Issue 1: Lofty API returns "User in token does not exist" (200058)

**Cause:** Using `Bearer` prefix instead of `token`
**Fix:** Change auth header from `Bearer ${key}` to `token ${key}`
**File:** `src/lib/integrations/lofty.ts` → `getHeaders()` function
**Docs:** https://developer.lofty.com/authentication/api-keys

## Issue 2: .env.local key gets truncated

**Cause:** Terminal/file tools have security redactors that replace JWT tokens with placeholders
**Fix:** Paste the Lofty API key manually into .env.local using nano/vim
**Workaround:** The app reads the key at runtime; just needs the full string in the file

## Issue 3: Port 3000 already in use

**Cause:** Previous dev server still running or unknown process on port 3000
**Fix:**
```bash
kill-port 3000
npm run dev
```
Or the dev server auto-switches to 3001

## Issue 4: Lockfile permission denied on WSL

**Cause:** npm/Next.js lockfile permissions issue in WSL filesystem
**Fix:**
```bash
rm -f .next/cache/lockfile
npm run dev
```

## Issue 5: Prisma/Postgres not available in dev

**Cause:** DATABASE_URL not set or Postgres not running
**Fix:** App falls back to file-backed JSON store. No action needed for local dev.
**Files:** `data/crm-records.json`, `data/sync-queue.json`, `data/workflow-state.json`

## Issue 6: MyPlus portal session expires

**Cause:** Idle timeout on MyPlus portal
**Fix:** Re-login before resuming lead sync
**Tip:** Keep the portal open in a tab while working through the queue

## Issue 7: Leads have no phone numbers

**Cause:** Legal News scraping captures names and notice text, not contact info
**Fix:** Enrich each lead in MyPlus via "Enhanced Contact Information" before Lofty sync
**Rule:** Do not block the batch on missing phones — enrich separately

## Issue 8: Duplicate leads in Lofty

**Cause:** Re-running import without checking existing records
**Fix:** Search Lofty by name before importing. If exists, update note on existing record.
**Tool:** `verifyLeadInLofty(apiKey, firstName, lastName)` checks for duplicates

## Issue 9: Lint errors in dashboard layout

**Cause:** Using `<a>` tags instead of `<Link>` from next/link
**Fix:** Replace `<a href="/dashboard/...">` with `<Link href="/dashboard/...">`
**File:** `src/app/dashboard/layout.tsx`

## Issue 10: npm ERESOLVE peer dependency conflicts

**Cause:** Package version mismatches (e.g., zod, @ai-sdk/openai)
**Fix:** Use `--legacy-peer-deps` flag: `npm install --legacy-peer-deps`
**Long-term:** Update packages to compatible versions

## Debugging Checklist

When something breaks:

1. **Check the browser console** — JavaScript errors, failed API calls
2. **Check terminal output** — Next.js server errors
3. **Check `.env.local`** — All keys present and correct length
4. **Check Lofty API** — Run `python3 scripts/test-lofty-key.py`
5. **Check MyPlus portal** — Is the session still active?
6. **Check data files** — `data/sync-queue.json`, `data/crm-records.json`
7. **Restart dev server** — `kill-port 3000 && npm run dev`
8. **Run tests** — `npm test`
9. **Run build** — `npm run build`

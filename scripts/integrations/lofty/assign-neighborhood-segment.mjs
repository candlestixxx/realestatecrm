#!/usr/bin/env node
/**
 * Assign every lead from the "ESTATES LANE 1-Macomb Twp" MyPlus neighborhood
 * import to the Lofty segment the user created:
 *
 *     ESTATES LN 1- MACOMB TOWNSHIP
 *
 * Existing segments on a lead are preserved; the new segment is added.
 *
 * Usage:
 *   node scripts/LOFTY/assign-neighborhood-segment.mjs --dry-run
 *   node scripts/LOFTY/assign-neighborhood-segment.mjs --commit
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const ENV_PATH = resolve(ROOT, '.env.local');
const DATA_DIR = resolve(ROOT, 'data');

const ARGS = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const DRY_RUN = !ARGS.commit;
const SEGMENT = 'ESTATES LN 1- MACOMB TOWNSHIP';
const LOFTY = 'https://api.lofty.com/v1.0';

function loadEnv() {
  const text = readFileSync(ENV_PATH, 'utf8');
  const out = {};
  for (const line of text.split('\n')) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    const i = s.indexOf('=');
    if (i === -1) continue;
    out[s.slice(0, i).trim()] = s.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

const headers = (key) => ({ Authorization: `token ${key}`, 'Content-Type': 'application/json' });

async function loftyGet(key, path) {
  const res = await fetch(LOFTY + path, { headers: headers(key) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`GET ${path}: HTTP ${res.status}`);
  return body;
}

async function loftyPut(key, path, data) {
  const res = await fetch(LOFTY + path, {
    method: 'PUT',
    headers: headers(key),
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`PUT ${path}: HTTP ${res.status} ${JSON.stringify(body).slice(0, 200)}`);
  return body;
}

async function main() {
  const env = loadEnv();
  const key = env.LOFTY_API_KEY;
  if (!key) {
    console.error('❌ Missing LOFTY_API_KEY');
    process.exit(1);
  }

  const results = JSON.parse(readFileSync(resolve(DATA_DIR, 'neighborhood-estates-lane-import-results.json'), 'utf8'));
  const created = results.results.created || [];
  const skipped = results.results.skipped || [];

  // Build a unique, ordered set of lead IDs (name → ids).
  const idMap = new Map(); // leadId -> { label, kind }
  for (const c of created) idMap.set(String(c.leadId), { label: c.label, kind: 'created' });
  for (const s of skipped) {
    for (const id of (s.loftyIds || []).map(String)) {
      if (!idMap.has(id)) idMap.set(id, { label: s.label, kind: 'skipped' });
    }
  }

  const entries = [...idMap.entries()];
  console.log(`🔄 Mode: ${DRY_RUN ? 'DRY-RUN' : 'COMMIT'}`);
  console.log(`🎯 Segment: "${SEGMENT}"`);
  console.log(`👥 Unique leads to assign: ${entries.length}\n`);

  const summary = { assigned: [], noChange: [], failed: [] };
  let i = 0;
  for (const [id, meta] of entries) {
    i += 1;
    process.stdout.write(`[${i}/${entries.length}] ${meta.label} (${id}) — `);
    if (DRY_RUN) {
      console.log(`PREVIEW add segment`);
      summary.assigned.push({ label: meta.label, leadId: id, dryRun: true });
      continue;
    }
    try {
      const body = await loftyGet(key, `/leads/${id}`);
      const cur = (body.lead || {}).segments || [];
      if (cur.includes(SEGMENT)) {
        console.log('SKIP (already in segment)');
        summary.noChange.push({ label: meta.label, leadId: id });
        continue;
      }
      const merged = [...cur, SEGMENT];
      await loftyPut(key, `/leads/${id}`, { segments: merged });
      console.log(`✅ assigned (segments: ${JSON.stringify(merged)})`);
      summary.assigned.push({ label: meta.label, leadId: id, segments: merged });
    } catch (err) {
      console.log(`❌ ${err.message}`);
      summary.failed.push({ label: meta.label, leadId: id, error: err.message });
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log('\n════════ SUMMARY ════════');
  console.log(`Assigned : ${summary.assigned.length}`);
  console.log(`Already  : ${summary.noChange.length}`);
  console.log(`Failed   : ${summary.failed.length}`);

  writeFileSync(
    resolve(DATA_DIR, 'neighborhood-estates-lane-segment-results.json'),
    JSON.stringify({ dryRun: DRY_RUN, segment: SEGMENT, summary }, null, 2),
  );
  console.log('\n📄 Results written to data/neighborhood-estates-lane-segment-results.json');
}

main().catch((err) => {
  console.error('\n❌ Fatal:', err.message);
  process.exit(1);
});

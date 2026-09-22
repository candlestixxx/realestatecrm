#!/usr/bin/env node
/**
 * Post-import finalizer for a MyPlus Neighborhood list import.
 *
 * 1. Attaches the full data note to every newly-created lead (POST /v1.0/notes)
 *    (Lofty's Create Lead endpoint does not persist the `content` note field).
 * 2. Applies the campaign hashtags to leads that already existed (duplicates).
 * 3. Assigns every lead (created + duplicate) to the target segment.
 *
 * Existing tags/segments on a lead are preserved.
 *
 * Usage:
 *   node scripts/LOFTY/finalize-neighborhood-list.mjs \
 *     --out=neighborhood-estates-ln2 \
 *     --tags="CIRCLE PROSPECT,ESTATES LN-MACOMB TWP" \
 *     --segment="ESTATES LN 2-MACOMB TWP" \
 *     --dry-run
 *   ... --commit
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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
const OUT = ARGS.out || 'neighborhood-estates-lane';
const TAGS = (ARGS.tags || 'CIRCLE PROSPECT,ESTATES LANE - MACOMB TWP')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const SEGMENT = ARGS.segment || null;
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

async function api(method, key, path, data) {
  const res = await fetch(LOFTY + path, {
    method,
    headers: headers(key),
    body: data ? JSON.stringify(data) : undefined,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path}: HTTP ${res.status} ${JSON.stringify(body).slice(0, 200)}`);
  return body;
}

async function main() {
  const env = loadEnv();
  const key = env.LOFTY_API_KEY;
  if (!key) {
    console.error('❌ Missing LOFTY_API_KEY');
    process.exit(1);
  }

  const built = JSON.parse(readFileSync(resolve(DATA_DIR, `${OUT}-built-payloads.json`), 'utf8'));
  const results = JSON.parse(readFileSync(resolve(DATA_DIR, `${OUT}-import-results.json`), 'utf8'));

  const nameToContent = new Map();
  for (const b of built) nameToContent.set(b.name, b.payload.content);

  const created = results.results.created || [];
  const skipped = results.results.skipped || [];

  console.log(`🔄 Mode: ${DRY_RUN ? 'DRY-RUN' : 'COMMIT'}`);
  console.log(`🏷️  Tags: ${TAGS.join(', ')}`);
  if (SEGMENT) console.log(`🎯 Segment: "${SEGMENT}"`);
  console.log(`📝 Notes for created leads: ${created.length}`);
  console.log(`🔁 Tag+segment for existing leads: ${skipped.length}\n`);

  const summary = { notesAdded: [], notesFailed: [], tagged: [], segmentAssigned: [], failed: [] };

  // 1) Notes on created leads.
  let i = 0;
  for (const c of created) {
    i += 1;
    const content = nameToContent.get(c.label);
    if (!content) {
      console.log(`[${i}/${created.length}] ${c.label} — ⚠️ no content`);
      summary.notesFailed.push({ label: c.label, leadId: c.leadId, error: 'no content' });
      continue;
    }
    process.stdout.write(`[${i}/${created.length}] note ${c.label} (${c.leadId}) — `);
    if (DRY_RUN) {
      console.log(`PREVIEW (${content.length} chars)`);
      summary.notesAdded.push({ label: c.label, leadId: c.leadId, dryRun: true });
      continue;
    }
    try {
      await api('POST', key, '/notes', { leadId: Number(c.leadId), content });
      console.log('✅');
      summary.notesAdded.push({ label: c.label, leadId: c.leadId });
    } catch (err) {
      console.log(`❌ ${err.message}`);
      summary.notesFailed.push({ label: c.label, leadId: c.leadId, error: err.message });
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  // 2) Tag + segment every lead (created + skipped duplicates).
  const leadSet = new Map(); // leadId -> label
  for (const c of created) leadSet.set(String(c.leadId), c.label);
  for (const s of skipped) {
    for (const id of (s.loftyIds || []).map(String)) {
      if (!leadSet.has(id)) leadSet.set(id, s.label);
    }
  }

  const entries = [...leadSet.entries()];
  let j = 0;
  for (const [id, label] of entries) {
    j += 1;
    process.stdout.write(`[${j}/${entries.length}] ${label} (${id}) — `);
    if (DRY_RUN) {
      console.log(`PREVIEW tags [${TAGS.join(', ')}]${SEGMENT ? ` + segment "${SEGMENT}"` : ''}`);
      summary.tagged.push({ label, leadId: id, dryRun: true });
      continue;
    }
    try {
      const body = await api('GET', key, `/leads/${id}`);
      const lead = body.lead || {};
      const curTags = (lead.tags || []).map((t) => (typeof t === 'string' ? t : t.tagName)).filter(Boolean);
      const curSegs = lead.segments || [];

      const mergedTags = [...new Set([...curTags, ...TAGS])];
      const mergedSegs = SEGMENT ? [...new Set([...curSegs, SEGMENT])] : curSegs;

      const patch = {};
      if (mergedTags.length !== curTags.length) patch.tags = mergedTags;
      if (SEGMENT && !curSegs.includes(SEGMENT)) patch.segments = mergedSegs;

      if (Object.keys(patch).length === 0) {
        console.log('SKIP (already tagged + segmented)');
        summary.tagged.push({ label, leadId: id, alreadyDone: true });
        continue;
      }

      await api('PUT', key, `/leads/${id}`, patch);
      const bits = [];
      if (patch.tags) bits.push('tags');
      if (patch.segments) bits.push('segment');
      console.log(`✅ ${bits.join('+')}`);
      summary.tagged.push({ label, leadId: id, applied: bits });
    } catch (err) {
      console.log(`❌ ${err.message}`);
      summary.failed.push({ label, leadId: id, error: err.message });
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log('\n════════ SUMMARY ════════');
  console.log(`Notes added    : ${summary.notesAdded.length}`);
  console.log(`Notes failed   : ${summary.notesFailed.length}`);
  console.log(`Tag/segment ok : ${summary.tagged.length}`);
  console.log(`Failed         : ${summary.failed.length}`);

  writeFileSync(
    resolve(DATA_DIR, `${OUT}-finalize-results.json`),
    JSON.stringify({ dryRun: DRY_RUN, tags: TAGS, segment: SEGMENT, summary }, null, 2),
  );
  console.log(`\n📄 Results written to data/${OUT}-finalize-results.json`);
}

main().catch((err) => {
  console.error('\n❌ Fatal:', err.message);
  process.exit(1);
});

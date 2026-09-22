#!/usr/bin/env node
/**
 * Post-import pass for the "ESTATES LANE 1-Macomb Twp" neighborhood import.
 *
 * The Lofty "Create Lead" endpoint does not persist the `content` note field,
 * so this script re-attaches the full data note (owner, contacts, DNC flags,
 * line types/scores, property values, predictions, listing details) to every
 * newly-created lead via POST /v1.0/notes.
 *
 * It also applies the two campaign hashtags to leads that already existed in
 * Lofty (the duplicates skipped during import) so the whole neighborhood list
 * carries both hashtags:
 *    1. CIRCLE PROSPECT
 *    2. ESTATES LANE - MACOMB TWP
 *
 * Usage:
 *   node scripts/LOFTY/add-neighborhood-notes-tags.mjs --dry-run
 *   node scripts/LOFTY/add-neighborhood-notes-tags.mjs --commit
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
const TAGS = ['CIRCLE PROSPECT', 'ESTATES LANE - MACOMB TWP'];
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

async function loftyPost(key, path, data) {
  const res = await fetch(LOFTY + path, {
    method: 'POST',
    headers: headers(key),
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`POST ${path}: HTTP ${res.status} ${JSON.stringify(body).slice(0, 200)}`);
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

async function loftyGet(key, path) {
  const res = await fetch(LOFTY + path, { headers: headers(key) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`GET ${path}: HTTP ${res.status}`);
  return body;
}

async function main() {
  const env = loadEnv();
  const key = env.LOFTY_API_KEY;
  if (!key) {
    console.error('❌ Missing LOFTY_API_KEY');
    process.exit(1);
  }

  const built = JSON.parse(readFileSync(resolve(DATA_DIR, 'neighborhood-estates-lane-built-payloads.json'), 'utf8'));
  const results = JSON.parse(readFileSync(resolve(DATA_DIR, 'neighborhood-estates-lane-import-results.json'), 'utf8'));

  const nameToContent = new Map();
  for (const b of built) nameToContent.set(b.name, b.payload.content);

  const created = results.results.created || [];
  const skipped = results.results.skipped || [];
  console.log(`🔄 Mode: ${DRY_RUN ? 'DRY-RUN' : 'COMMIT'}`);
  console.log(`📝 Notes to add (created leads): ${created.length}`);
  console.log(`🏷️  Tags to apply (existing leads): ${skipped.length}\n`);

  const summary = { notesAdded: [], notesFailed: [], tagsApplied: [], tagsFailed: [] };

  // 1) Rich note on every newly-created lead.
  let i = 0;
  for (const c of created) {
    i += 1;
    const content = nameToContent.get(c.label);
    if (!content) {
      console.log(`[${i}/${created.length}] ${c.label} — ⚠️ no note content found`);
      summary.notesFailed.push({ label: c.label, leadId: c.leadId, error: 'no content' });
      continue;
    }
    process.stdout.write(`[${i}/${created.length}] ${c.label} (${c.leadId}) — `);
    if (DRY_RUN) {
      console.log(`PREVIEW note (${content.length} chars)`);
      summary.notesAdded.push({ label: c.label, leadId: c.leadId, dryRun: true });
      continue;
    }
    try {
      await loftyPost(key, '/notes', { leadId: Number(c.leadId), content });
      console.log('✅ note added');
      summary.notesAdded.push({ label: c.label, leadId: c.leadId });
    } catch (err) {
      console.log(`❌ ${err.message}`);
      summary.notesFailed.push({ label: c.label, leadId: c.leadId, error: err.message });
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  // 2) Hashtags on leads that already existed (skipped duplicates).
  let j = 0;
  for (const s of skipped) {
    j += 1;
    const ids = (s.loftyIds || []).map(String);
    if (!ids.length) continue;
    for (const id of ids) {
      process.stdout.write(`[${j}/${skipped.length}] ${s.label} (${id}) — `);
      if (DRY_RUN) {
        console.log(`PREVIEW tags [${TAGS.join(', ')}]`);
        summary.tagsApplied.push({ label: s.label, leadId: id, dryRun: true });
        continue;
      }
      try {
        const body = await loftyGet(key, `/leads/${id}`);
        const cur = (body.lead || {}).tags || [];
        const curNames = cur.map((t) => (typeof t === 'string' ? t : t.tagName)).filter(Boolean);
        const merged = [...new Set([...curNames, ...TAGS])];
        if (merged.length === curNames.length) {
          console.log('SKIP (tags already present)');
          summary.tagsApplied.push({ label: s.label, leadId: id, alreadyHadTags: true });
          continue;
        }
        await loftyPut(key, `/leads/${id}`, { tags: merged });
        console.log('✅ tags applied');
        summary.tagsApplied.push({ label: s.label, leadId: id });
      } catch (err) {
        console.log(`❌ ${err.message}`);
        summary.tagsFailed.push({ label: s.label, leadId: id, error: err.message });
      }
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  console.log('\n════════ SUMMARY ════════');
  console.log(`Notes added : ${summary.notesAdded.length}`);
  console.log(`Notes failed: ${summary.notesFailed.length}`);
  console.log(`Tags applied: ${summary.tagsApplied.length}`);
  console.log(`Tags failed : ${summary.tagsFailed.length}`);

  writeFileSync(
    resolve(DATA_DIR, 'neighborhood-estates-lane-notes-tags-results.json'),
    JSON.stringify({ dryRun: DRY_RUN, tags: TAGS, summary }, null, 2),
  );
  console.log('\n📄 Results written to data/neighborhood-estates-lane-notes-tags-results.json');
}

main().catch((err) => {
  console.error('\n❌ Fatal:', err.message);
  process.exit(1);
});

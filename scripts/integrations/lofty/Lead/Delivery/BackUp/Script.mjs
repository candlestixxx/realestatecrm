#!/usr/bin/env node
/**
 * LOFTY / Lead / Delivery / BackUp / Script
 * ─────────────────────────────────────────────────────────────────────────────
 * Imports MyPlus Leads (Expired / Canceled / FSBO) into Lofty CRM.
 *
 * Pipeline:
 *   1. Authenticate to MyPlus Leads (api.myplusleads.com)
 *   2. Fetch listings for a date range (default: 2026-09-17 -> 2026-09-21)
 *   3. Map each listing into a full Lofty "Create Lead" payload:
 *        - name, every phone number (contact + augmented), every email
 *        - property address + beds/baths/sqft/lot/year-built/MLS/APN/price
 *        - stage + tags (Expired / Canceled / FSBO + MyPlus/Lofty)
 *        - a full data note (line types, DNC flags, co-owner, values, etc.)
 *   4. De-duplicate against Lofty (precise phone + email search)
 *   5. Create missing leads via POST https://api.lofty.com/v1.0/leads
 *
 * Usage:
 *   node "scripts/LOFTY/Lead/Delivery/BackUp/Script.mjs" --dry-run   # preview
 *   node "scripts/LOFTY/Lead/Delivery/BackUp/Script.mjs" --commit    # import
 *   node "scripts/LOFTY/Lead/Delivery/BackUp/Script.mjs" --from "2026-09-17 00:00:00" --to "2026-09-21 23:59:59" --commit
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { createHash } from 'crypto';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// scripts/LOFTY/Lead/Delivery/BackUp -> project root (5 levels up)
const ROOT = resolve(__dirname, '..', '..', '..', '..', '..');
const ENV_PATH = resolve(ROOT, '.env.local');
const DATA_DIR = resolve(ROOT, 'data');

const ARGS = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const DRY_RUN = !ARGS.commit;
const FROM = ARGS.from || '2026-09-17 00:00:00';
const TO = ARGS.to || '2026-09-21 23:59:59';

// ── env helpers ────────────────────────────────────────────────────────────
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

// ── MyPlus Leads API ───────────────────────────────────────────────────────
const sha1Base64 = (s) => createHash('sha1').update(s).digest('base64');

async function myplusAuthenticate(env) {
  const res = await fetch('https://api.myplusleads.com/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: env.MYPLUS_USERNAME, password: sha1Base64(env.MYPLUS_PASSWORD) }),
  });
  if (!res.ok) throw new Error(`MyPlus auth failed: HTTP ${res.status}`);
  const data = await res.json();
  if (!data.authenticatedToken) throw new Error('No authenticatedToken from MyPlus');
  return data.authenticatedToken;
}

async function myplusFetchListings(token, from, to) {
  const url =
    'https://api.myplusleads.com/listings?isForUser=true' +
    `&dateFrom=${encodeURIComponent(from)}&dateTo=${encodeURIComponent(to)}`;
  const res = await fetch(url, { headers: { Authorization: token, Accept: 'application/json' } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`MyPlus listings failed: HTTP ${res.status} ${body.slice(0, 300)}`);
  }
  return res.json();
}

// ── Lofty API ──────────────────────────────────────────────────────────────
const LOFTY = 'https://api.lofty.com/v1.0';
const loftyHeaders = (key) => ({ Authorization: `token ${key}`, 'Content-Type': 'application/json' });

async function loftyGet(key, path) {
  const res = await fetch(LOFTY + path, { headers: loftyHeaders(key) });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Lofty GET ${path}: HTTP ${res.status} ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function loftyPost(key, path, data) {
  const res = await fetch(LOFTY + path, {
    method: 'POST',
    headers: loftyHeaders(key),
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Lofty POST ${path}: HTTP ${res.status} ${JSON.stringify(body).slice(0, 300)}`);
  }
  return body;
}

async function loftyFindByContact(key, phones, emails) {
  const ids = new Set();
  for (const phone of phones.slice(0, 5)) {
    try {
      const body = await loftyGet(key, `/leads?phone=${encodeURIComponent(phone)}&limit=5`);
      for (const lead of body.leads || []) ids.add(String(lead.leadId));
    } catch (_) {}
  }
  for (const email of emails.slice(0, 5)) {
    try {
      const body = await loftyGet(key, `/leads?email=${encodeURIComponent(email)}&limit=5`);
      for (const lead of body.leads || []) ids.add(String(lead.leadId));
    } catch (_) {}
  }
  return [...ids];
}

// ── mapping helpers ────────────────────────────────────────────────────────
const MAX_NAME = 30;
const MAX_PHONE = 20;
const trunc = (s, n) => String(s ?? '').slice(0, n);
const clean = (s) => String(s ?? '').trim();
const uniq = (arr) => [...new Set(arr.map(clean).filter(Boolean))];
const cleanPhone = (p) => trunc(clean(p).replace(/[^\d+]/g, ''), MAX_PHONE);

/** Every augmentedData* block on a listing (dynamic — handles 1..N, sorted 1..N). */
function augmentedBlocks(listing) {
  const blocks = [];
  for (const key of Object.keys(listing)) {
    const m = /^augmentedData(\d+)$/.exec(key);
    if (m && listing[key]) blocks.push({ n: Number(m[1]), block: listing[key] });
  }
  blocks.sort((a, b) => a.n - b.n);
  return blocks.map((b) => b.block);
}

function collectPhones(listing) {
  const out = [];
  const c1 = listing.contact1 || {};
  const c2 = listing.contact2 || {};
  push(c1.phone1); push(c1.phone2); push(c1.phone3);
  push(c2.phone1); push(c2.phone2); push(c2.phone3);
  for (const aug of augmentedBlocks(listing)) {
    push(aug.augmentedPhone1); push(aug.augmentedPhone2);
    push(aug.augmentedPhone3); push(aug.augmentedPhone4);
  }
  return uniq(out.map(cleanPhone));
  function push(v) { if (v) out.push(v); }
}

function collectEmails(listing) {
  const out = [];
  const c1 = listing.contact1 || {};
  const c2 = listing.contact2 || {};
  push(c1.email); push(c2.email);
  for (const aug of augmentedBlocks(listing)) {
    push(aug.augmentedEmail1); push(aug.augmentedEmail2); push(aug.augmentedEmail3);
  }
  return uniq(out).map((e) => e.toLowerCase());
  function push(v) { if (v) out.push(v); }
}

function parseName(listing) {
  const owner = listing.owner || {};
  const full = clean(owner.name);
  if (full) {
    const tokens = full.split(/\s+/).filter(Boolean);
    return {
      firstName: trunc(tokens[0], MAX_NAME),
      lastName: trunc(tokens.slice(1).join(' '), MAX_NAME),
    };
  }
  const street = clean(listing.propertyAddress?.streetAddress);
  if (owner.firstName || owner.lastName) {
    return { firstName: trunc(owner.firstName || 'Owner', MAX_NAME), lastName: trunc(owner.lastName || street || '', MAX_NAME) };
  }
  return { firstName: 'Owner', lastName: trunc(street || 'Unknown', MAX_NAME) };
}

const toInt = (v) => { const n = parseInt(clean(v).replace(/[^0-9.-]/g, ''), 10); return Number.isFinite(n) ? n : undefined; };
const toNum = (v) => { const n = parseFloat(clean(v).replace(/[^0-9.-]/g, '')); return Number.isFinite(n) ? n : undefined; };
const yn = (v) => (v === null || v === undefined || v === '' ? undefined : String(v));

function dncTag(flag) { return flag ? ' (DNC)' : ''; }
const LINE_TYPE = { M: 'Mobile', O: 'Other', L: 'Landline' };

function buildNote(listing, name) {
  const p = listing.propertyDetails || {};
  const a = listing.propertyAddress || {};
  const o = listing.owner || {};
  const c1 = listing.contact1 || {};
  const c2 = listing.contact2 || {};
  const stage = clean(p.normalizedStatus || p.status);
  const lines = [];

  lines.push(`MyPlus Leads import — ${stage || 'n/a'}`);
  lines.push(`Listing ID: ${listing.listingId}`);
  lines.push(`Processed: ${listing.processedDate}`);

  lines.push('');
  lines.push('PROPERTY');
  const addr = [a.streetAddress, a.city, a.state, a.zip].filter(Boolean).join(', ');
  if (addr) lines.push(`Address: ${addr}`);
  if (a.county) lines.push(`County: ${a.county}`);
  if (p.price) lines.push(`Listing Price: ${p.price}`);
  if (p.bedrooms) lines.push(`Bedrooms: ${p.bedrooms}`);
  if (p.bathrooms) lines.push(`Bathrooms: ${p.bathrooms}`);
  if (p.square_footage) lines.push(`Square Footage: ${p.square_footage}`);
  if (p.lotSize) lines.push(`Lot Size (sqft): ${p.lotSize}`);
  if (p.yearBuilt) lines.push(`Year Built: ${p.yearBuilt}`);
  if (p.mlsNumber) lines.push(`MLS Number: ${p.mlsNumber}`);
  if (p.propertyType) lines.push(`Property Type: ${p.propertyType}`);
  if (o.apn) lines.push(`APN: ${o.apn}`);
  if (p.url) lines.push(`Source URL: ${p.url}`);

  lines.push('');
  lines.push('OWNER');
  lines.push(`Name: ${clean(o.name) || `${name.firstName} ${name.lastName || ''}`.trim()}`);
  if (o.name2) lines.push(`Co-owner: ${clean(o.name2)}`);
  if (o.totalValue) lines.push(`Total Value: ${o.totalValue}`);
  if (o.assessed_value) lines.push(`Assessed Value: ${o.assessed_value}`);
  if (o.taxYear) lines.push(`Tax Year: ${o.taxYear}`);
  if (yn(o.occupied)) lines.push(`Occupied: ${yn(o.occupied)}`);
  if (o.saleDate) lines.push(`Sale Date: ${o.saleDate}`);
  if (o.saleAmount) lines.push(`Sale Amount: ${o.saleAmount}`);
  if (o.relationshipType) lines.push(`Relationship: ${o.relationshipType}`);

  if (clean(c1.name) || c1.phone1 || c1.phone2 || c1.email) {
    lines.push('');
    lines.push('CONTACT 1');
    if (clean(c1.name)) lines.push(`Name: ${clean(c1.name)}`);
    if (c1.phone1) lines.push(`Phone 1: ${clean(c1.phone1)}${dncTag(c1.dnc1)}`);
    if (c1.phone2) lines.push(`Phone 2: ${clean(c1.phone2)}${dncTag(c1.dnc2)}`);
    if (c1.email) lines.push(`Email: ${clean(c1.email)}`);
  }

  if (clean(c2.name) || c2.phone1 || c2.phone2 || c2.email) {
    lines.push('');
    lines.push('CONTACT 2');
    if (clean(c2.name)) lines.push(`Name: ${clean(c2.name)}`);
    if (c2.phone1) lines.push(`Phone 1: ${clean(c2.phone1)}${dncTag(c2.dnc1)}`);
    if (c2.phone2) lines.push(`Phone 2: ${clean(c2.phone2)}${dncTag(c2.dnc2)}`);
    if (c2.email) lines.push(`Email: ${clean(c2.email)}`);
  }

  const augLines = [];
  for (const aug of augmentedBlocks(listing)) {
    const entries = [
      [aug.augmentedPhone1, aug.lineType1, aug.dnc1],
      [aug.augmentedPhone2, aug.lineType2, aug.dnc2],
      [aug.augmentedPhone3, aug.lineType3, aug.dnc3],
      [aug.augmentedPhone4, aug.lineType4, aug.dnc4],
    ];
    for (const [ph, lt, dnc] of entries) {
      if (ph) augLines.push(`${clean(ph)}${lt ? ` (${LINE_TYPE[clean(lt)] || clean(lt)})` : ''}${dnc ? ' (DNC)' : ''}`);
    }
    [aug.augmentedEmail1, aug.augmentedEmail2, aug.augmentedEmail3].forEach((e) => {
      if (e) augLines.push(`Email: ${clean(e)}`);
    });
  }
  if (augLines.length) {
    lines.push('');
    lines.push('AUGMENTED CONTACT INFO');
    lines.push(...augLines);
  }

  return lines.join('\n');
}

function buildLoftyPayload(listing) {
  const p = listing.propertyDetails || {};
  const addr = listing.propertyAddress || {};
  const name = parseName(listing);
  const stage = clean(p.normalizedStatus || p.status);
  const phones = collectPhones(listing);
  const emails = collectEmails(listing);
  const price = toInt(p.price);

  const property = {
    streetAddress: trunc(addr.streetAddress, 200) || undefined,
    city: addr.city || undefined,
    state: addr.state || undefined,
    zipCode: addr.zip || undefined,
    county: addr.county || undefined,
  };
  if (price) property.price = price;
  if (toInt(p.bedrooms)) property.bedrooms = toInt(p.bedrooms);
  if (toNum(p.bathrooms)) property.bathrooms = toNum(p.bathrooms);
  if (toInt(p.square_footage)) property.squareFeet = toInt(p.square_footage);
  const lotSqft = toNum(p.lotSize);
  if (lotSqft) property.lotSize = Math.round((lotSqft / 43560) * 100) / 100; // sqft → acres

  const payload = {
    firstName: name.firstName,
    lastName: name.lastName || undefined,
    emails: emails.length ? emails : undefined,
    phones: phones.length ? phones : undefined,
    leadTypes: [1], // Seller
    source: 'my +plus leads',
    stage: stage || undefined,
    tags: ['MyPlus/Lofty', stage].filter(Boolean),
    property,
    content: buildNote(listing, name),
  };

  return { payload, phones, emails, name, stage, listing };
}

// ── main ───────────────────────────────────────────────────────────────────
async function main() {
  const env = loadEnv();
  if (!env.MYPLUS_USERNAME || !env.MYPLUS_PASSWORD) {
    console.error('❌ Missing MYPLUS_USERNAME / MYPLUS_PASSWORD in .env.local');
    process.exit(1);
  }
  if (!env.LOFTY_API_KEY) {
    console.error('❌ Missing LOFTY_API_KEY in .env.local');
    process.exit(1);
  }

  console.log(`🔄 Mode: ${DRY_RUN ? 'DRY-RUN (no leads created)' : 'COMMIT (creating leads)'}`);
  console.log(`📅 Range: ${FROM} → ${TO}\n`);

  console.log('🔑 Authenticating to MyPlus Leads...');
  const token = await myplusAuthenticate(env);

  console.log('📥 Fetching MyPlus listings...');
  const res = await myplusFetchListings(token, FROM, TO);
  const listings = res.listings || [];
  console.log(`   Received ${listings.length} listings.\n`);

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(resolve(DATA_DIR, 'myplus-import-source.json'), JSON.stringify(res, null, 2));

  const built = listings.map(buildLoftyPayload);
  // Backup of the exact payloads that will be sent to Lofty.
  writeFileSync(
    resolve(DATA_DIR, 'myplus-lofty-built-payloads.json'),
    JSON.stringify(
      built.map((b) => ({ listingId: b.listing.listingId, stage: b.stage, payload: b.payload })),
      null,
      2,
    ),
  );
  const byStatus = {};
  for (const b of built) byStatus[b.stage || 'n/a'] = (byStatus[b.stage || 'n/a'] || 0) + 1;
  console.log('📊 Breakdown:', JSON.stringify(byStatus), '\n');

  const results = { created: [], skipped: [], failed: [] };
  let i = 0;
  for (const b of built) {
    i += 1;
    const label = `${b.name.firstName} ${b.name.lastName || ''}`.trim() || `listing ${b.listing.listingId}`;
    process.stdout.write(`   [${i}/${built.length}] ${label} (${b.stage}) — `);

    if (DRY_RUN) {
      console.log(`PREVIEW [${b.phones.length} phones, ${b.emails.length} emails]`);
      results.skipped.push({ label, reason: 'dry-run', phones: b.phones, emails: b.emails, stage: b.stage });
      continue;
    }

    const existing = await loftyFindByContact(env.LOFTY_API_KEY, b.phones, b.emails);
    if (existing.length) {
      console.log(`SKIP (exists in Lofty: ${existing.join(',')})`);
      results.skipped.push({ label, reason: 'duplicate', loftyIds: existing, stage: b.stage });
      continue;
    }

    try {
      const body = await loftyPost(env.LOFTY_API_KEY, '/leads', b.payload);
      const leadId = body.leadId ?? body.data?.leadId ?? 'unknown';
      console.log(`✅ CREATED (Lofty ID ${leadId})`);
      results.created.push({ label, leadId: String(leadId), stage: b.stage, phones: b.phones.length, emails: b.emails.length });
    } catch (err) {
      console.log(`❌ FAILED — ${err.message}`);
      results.failed.push({ label, error: err.message, stage: b.stage });
    }

    await new Promise((r) => setTimeout(r, 400));
  }

  console.log('\n════════ SUMMARY ════════');
  console.log(`Created : ${results.created.length}`);
  console.log(`Skipped : ${results.skipped.length}`);
  console.log(`Failed  : ${results.failed.length}`);

  writeFileSync(
    resolve(DATA_DIR, 'myplus-lofty-import-results.json'),
    JSON.stringify({ dryRun: DRY_RUN, from: FROM, to: TO, results }, null, 2),
  );
  console.log(`\n📄 Results written to data/myplus-lofty-import-results.json`);
}

main().catch((err) => {
  console.error('\n❌ Fatal:', err.message);
  process.exit(1);
});

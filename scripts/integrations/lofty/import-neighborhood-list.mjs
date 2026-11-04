#!/usr/bin/env node
/**
 * Generic MyPlus "Neighborhood Data" → Lofty importer.
 *
 * Reads a saved MyPlus `api/neighborhood/search` response and imports each
 * property as a Lofty lead, collecting every phone + email, property detail,
 * owner info, premium/basic contacts, and writing the full data note.
 *
 * Usage:
 *   node scripts/LOFTY/import-neighborhood-list.mjs \
 *     --source=data/neighborhood-estates-ln2-source.json \
 *     --out=neighborhood-estates-ln2 \
 *     --list-name="ESTATES LN 2-Macomb Township" \
 *     --tags="CIRCLE PROSPECT,ESTATES LN-MACOMB TWP" \
 *     --skip-no-premium \
 *     --dry-run            # preview
 *     --commit             # create leads
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
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
const SOURCE_FILE = ARGS.source || 'neighborhood-estates-lane-source.json';
const OUT_PREFIX = ARGS.out || 'neighborhood-estates-lane';
const LIST_NAME = ARGS['list-name'] || 'ESTATES LANE 1-Macomb Twp';
const TAGS = (ARGS.tags || 'CIRCLE PROSPECT,ESTATES LANE - MACOMB TWP')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const SKIP_NO_PREMIUM = !!ARGS['skip-no-premium'];
const SOURCE = 'my +plus leads';

// ── helpers ────────────────────────────────────────────────────────────────
const clean = (s) => String(s ?? '').trim();
const trunc = (s, n) => String(s ?? '').slice(0, n);
const uniq = (arr) => [...new Set(arr.map(clean).filter(Boolean))];
const cleanPhone = (p) => trunc(clean(p).replace(/[^\d+]/g, ''), 20);
const toInt = (v) => {
  const n = parseInt(clean(v).replace(/[^0-9.-]/g, ''), 10);
  return Number.isFinite(n) ? n : undefined;
};
const toNum = (v) => {
  const n = parseFloat(clean(v).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : undefined;
};
const yn = (v) => (v === null || v === undefined || v === '' ? undefined : String(v));

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

// ── mapping ────────────────────────────────────────────────────────────────
function premiumContacts(prop) {
  const pd = prop.premiumDetails || {};
  const out = [];
  for (let i = 1; i <= 6; i++) {
    if (pd[`contact${i}`]) out.push(pd[`contact${i}`]);
  }
  return out;
}

function collectPhones(prop) {
  const out = [];
  const push = (v) => { if (v) out.push(v); };
  for (const c of premiumContacts(prop)) {
    for (let i = 1; i <= 4; i++) {
      const p = c[`phone${i}`];
      if (p && p.phone) push(p.phone);
    }
  }
  const b1 = prop.basicContact1 || {};
  const b2 = prop.basicContact2 || {};
  if (b1.phone && b1.phone.phone) push(b1.phone.phone);
  if (b2.phone && b2.phone.phone) push(b2.phone.phone);
  const custom = prop.customPhones || [];
  for (const cp of custom) {
    if (typeof cp === 'string') push(cp);
    else if (cp && cp.phone) push(cp.phone);
  }
  return uniq(out.map(cleanPhone));
}

function collectEmails(prop) {
  const out = [];
  const push = (v) => { if (v) out.push(v); };
  for (const c of premiumContacts(prop)) {
    for (let i = 1; i <= 3; i++) push(c[`email${i}`]);
  }
  const b1 = prop.basicContact1 || {};
  const b2 = prop.basicContact2 || {};
  push(b1.email1); push(b1.email2);
  push(b2.email1); push(b2.email2);
  return uniq(out).map((e) => e.toLowerCase());
}

function isNaturalPersonName(n) {
  if (!n) return false;
  const s = n.toLowerCase();
  return !/trust|llc|inc|ltd|corporation|\bcorp\b|\bco\b|&|estate\b/.test(s);
}

function titleCase(s) {
  return clean(s).toLowerCase().replace(/(^|\s|[-'])([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
}

function parseName(prop) {
  const owner = prop.ownerInfo || {};
  const oName = clean(owner.name1);
  if (oName && isNaturalPersonName(oName)) {
    const tokens = oName.split(/\s+/).filter(Boolean);
    return {
      firstName: trunc(tokens[0], 30),
      lastName: trunc(tokens.slice(1).join(' '), 30) || undefined,
    };
  }
  const pd = prop.premiumDetails || {};
  const c1 = pd.contact1;
  if (c1 && (c1.firstName || c1.lastName)) {
    return {
      firstName: trunc(titleCase(c1.firstName), 30),
      lastName: trunc(titleCase(c1.lastName), 30) || undefined,
    };
  }
  const b1 = prop.basicContact1 || {};
  const bName = clean(b1.name);
  if (bName) {
    const tokens = bName.split(/\s+/).filter(Boolean);
    return {
      firstName: trunc(tokens[0], 30),
      lastName: trunc(tokens.slice(1).join(' '), 30) || undefined,
    };
  }
  if (oName) {
    const tokens = oName.split(/\s+/).filter(Boolean);
    return {
      firstName: trunc(tokens[0], 30),
      lastName: trunc(tokens.slice(1).join(' '), 30) || undefined,
    };
  }
  const street = clean(prop.propertyDetails?.streetAddress);
  return { firstName: 'Owner', lastName: trunc(street || 'Unknown', 30) };
}

function phoneLabel(p) {
  if (!p) return '';
  const parts = [clean(p.phone)];
  if (p.typeValue) parts.push(p.typeValue);
  if (p.score) parts.push(p.score);
  if (p.dnc) parts.push('DNC');
  return parts.join(' | ');
}

function buildNote(prop, name) {
  const pd = prop.propertyDetails || {};
  const owner = prop.ownerInfo || {};
  const lines = [];

  lines.push(`MyPlus Neighborhood Data import — ${LIST_NAME}`);
  lines.push(`Source: ${SOURCE}`);
  lines.push(`Address ID: ${prop.fullAddressId}`);

  lines.push('');
  lines.push('PROPERTY');
  const addr = [pd.streetAddress, pd.city, pd.state, pd.zip].filter(Boolean).join(', ');
  if (addr) lines.push(`Address: ${addr}`);
  if (pd.county) lines.push(`County: ${pd.county}`);
  if (pd.subdivision) lines.push(`Subdivision: ${pd.subdivision}`);
  if (pd.beds) lines.push(`Bedrooms: ${pd.beds}`);
  if (pd.baths) lines.push(`Bathrooms: ${pd.baths}`);
  if (pd.squareFootage) lines.push(`Square Footage: ${pd.squareFootage}`);
  if (pd.lotSize) lines.push(`Lot Size (sqft): ${pd.lotSize}`);
  if (pd.yearBuilt) lines.push(`Year Built: ${pd.yearBuilt}`);
  if (pd.propertyType) lines.push(`Property Type: ${pd.propertyType}`);
  if (pd.totalValue) lines.push(`Total Value: ${pd.totalValue}`);
  if (pd.estimatedValue) lines.push(`Estimated Value: ${pd.estimatedValue}`);
  if (pd.assessedValue) lines.push(`Assessed Value: ${pd.assessedValue}`);
  if (pd.taxYear) lines.push(`Tax Year: ${pd.taxYear}`);
  if (pd.taxAmount) lines.push(`Tax Amount: ${pd.taxAmount}`);
  if (pd.soldAmount) lines.push(`Sold Amount: ${pd.soldAmount}`);
  if (pd.soldDate) lines.push(`Sold Date: ${pd.soldDate}`);
  if (pd.acreage) lines.push(`Acreage: ${pd.acreage}`);

  lines.push('');
  lines.push('OWNER');
  lines.push(`Name: ${clean(owner.name1) || `${name.firstName} ${name.lastName || ''}`.trim()}`);
  if (owner.name2) lines.push(`Co-owner: ${clean(owner.name2)}`);
  if (owner.name3) lines.push(`Owner 3: ${clean(owner.name3)}`);
  if (owner.name4) lines.push(`Owner 4: ${clean(owner.name4)}`);
  if (owner.ownerOccupied) lines.push(`Owner Occupied: ${owner.ownerOccupied}`);
  if (owner.lengthOfOwnership) lines.push(`Length of Ownership: ${owner.lengthOfOwnership}`);
  if (owner.relationshipType) lines.push(`Relationship: ${owner.relationshipType}`);
  if (owner.apn) lines.push(`APN: ${owner.apn}`);
  if (owner.fullAddress) lines.push(`Mailing Address: ${owner.fullAddress}`);

  const advanced = prop.advancedDetails || {};
  const advFlags = [];
  if (advanced.absentee) advFlags.push('Absentee');
  if (advanced.highEquity) advFlags.push('High Equity');
  if (advanced.lowEquity) advFlags.push('Low Equity');
  if (advanced.emptyNester) advFlags.push('Empty Nester');
  if (advanced.moverUpper) advFlags.push('Mover Upper');
  if (advanced.freeAndClear) advFlags.push('Free & Clear');
  if (advanced.outOfStateOwners) advFlags.push('Out-of-State Owners');
  if (advanced.agentOwned) advFlags.push('Agent Owned');
  if (advanced.agentPossiblyOwned) advFlags.push('Agent Possibly Owned');
  if (advFlags.length) {
    lines.push('');
    lines.push('ADVANCED FLAGS');
    lines.push(advFlags.join(', '));
  }

  const pred = prop.predictionDetails || {};
  if (pred && Object.keys(pred).length) {
    lines.push('');
    lines.push('PREDICTION');
    if (pred.saleScoreQuantile) lines.push(`Sale Score Quantile: ${pred.saleScoreQuantile}`);
    if (pred.contactRateQuantile) lines.push(`Contact Rate Quantile: ${pred.contactRateQuantile}`);
    if (pred.leadRateQuantile) lines.push(`Lead Rate Quantile: ${pred.leadRateQuantile}`);
    if (pred.predictionPercentageScore) lines.push(`Prediction Score: ${pred.predictionPercentageScore}%`);
    if (pred.hotLeadRecommended) lines.push('Hot Lead Recommended: true');
    if (pred.followUpRecommended) lines.push('Follow-up Recommended: true');
    if (pred.mlEstimatedValue) lines.push(`ML Estimated Value: ${pred.mlEstimatedValue}`);
  }

  const pcs = premiumContacts(prop);
  for (let i = 0; i < pcs.length; i++) {
    const c = pcs[i];
    const phones = [c.phone1, c.phone2, c.phone3, c.phone4].filter(Boolean);
    const emails = [c.email1, c.email2, c.email3].filter(Boolean);
    if (c.fullName || phones.length || emails.length) {
      lines.push('');
      lines.push(`PREMIUM CONTACT ${i + 1}`);
      if (c.fullName) lines.push(`Name: ${clean(c.fullName)}`);
      for (const p of phones) lines.push(`Phone: ${phoneLabel(p)}`);
      for (const e of emails) lines.push(`Email: ${clean(e)}`);
    }
  }

  const b1 = prop.basicContact1;
  const b2 = prop.basicContact2;
  for (let i = 0; i < 2; i++) {
    const b = i === 0 ? b1 : b2;
    if (!b) continue;
    const has = b.name || (b.phone && b.phone.phone) || b.email1 || b.email2;
    if (!has) continue;
    lines.push('');
    lines.push(`BASIC CONTACT ${i + 1}`);
    if (b.name) lines.push(`Name: ${clean(b.name)}`);
    if (b.phone && b.phone.phone) lines.push(`Phone: ${phoneLabel(b.phone)}`);
    if (b.email1) lines.push(`Email 1: ${clean(b.email1)}`);
    if (b.email2) lines.push(`Email 2: ${clean(b.email2)}`);
    if (b.dateOfBirth) lines.push(`DOB: ${b.dateOfBirth}`);
    if (b.gender) lines.push(`Gender: ${b.gender}`);
    if (b.maritalStatus) lines.push(`Marital Status: ${b.maritalStatus}`);
    if (b.numberOfChildren) lines.push(`Children: ${b.numberOfChildren}`);
  }

  const listings = prop.listingDetails || [];
  for (let i = 0; i < listings.length; i++) {
    const l = listings[i];
    lines.push('');
    lines.push(`LISTING ${i + 1}`);
    if (l.status) lines.push(`Status: ${l.status}`);
    if (l.mls) lines.push(`MLS: ${l.mls}`);
    if (l.price) lines.push(`Price: ${l.price}`);
    if (l.squareFootage) lines.push(`Listing SqFt: ${l.squareFootage}`);
    if (l.daysOnMarket) lines.push(`Days on Market: ${l.daysOnMarket}`);
    if (l.agentInfo && l.agentInfo.name) lines.push(`Agent: ${l.agentInfo.name} (${l.agentInfo.office || ''})`);
    if (l.remarks) lines.push(`Remarks: ${clean(l.remarks)}`);
  }

  return lines.join('\n');
}

function buildLoftyPayload(prop) {
  const pd = prop.propertyDetails || {};
  const name = parseName(prop);
  const phones = collectPhones(prop);
  const emails = collectEmails(prop);

  const property = {
    streetAddress: trunc(pd.streetAddress, 200) || undefined,
    city: pd.city || undefined,
    state: pd.state || undefined,
    zipCode: pd.zip || undefined,
    county: pd.county || undefined,
  };
  if (toInt(pd.beds)) property.bedrooms = toInt(pd.beds);
  if (toNum(pd.baths)) property.bathrooms = toNum(pd.baths);
  if (toInt(pd.squareFootage)) property.squareFeet = toInt(pd.squareFootage);
  const lotSqft = toNum(pd.lotSize);
  if (lotSqft) property.lotSize = Math.round((lotSqft / 43560) * 100) / 100;
  if (toInt(pd.yearBuilt)) property.yearBuilt = toInt(pd.yearBuilt);
  if (pd.propertyType) property.propertyType = pd.propertyType;

  const payload = {
    firstName: name.firstName,
    lastName: name.lastName || undefined,
    emails: emails.length ? emails : undefined,
    phones: phones.length ? phones : undefined,
    leadTypes: [1],
    source: SOURCE,
    tags: TAGS,
    property,
    content: buildNote(prop, name),
  };

  return { payload, phones, emails, name, prop };
}

// ── main ───────────────────────────────────────────────────────────────────
async function main() {
  const env = loadEnv();
  if (!env.LOFTY_API_KEY) {
    console.error('❌ Missing LOFTY_API_KEY in .env.local');
    process.exit(1);
  }
  const sourcePath = resolve(DATA_DIR, SOURCE_FILE);
  if (!existsSync(sourcePath)) {
    console.error(`❌ Missing source data: ${sourcePath}`);
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(sourcePath, 'utf8'));
  let properties = raw?.data?.properties || [];

  let skippedPremium = [];
  if (SKIP_NO_PREMIUM) {
    const before = properties.length;
    const keep = [];
    for (const p of properties) {
      const st = (p.premiumDetails || {}).augmentationStatus;
      if (st === 'SUCCESS') keep.push(p);
      else skippedPremium.push({ fullAddressId: p.fullAddressId, status: st || 'MISSING' });
    }
    properties = keep;
    console.log(`🚫 Skipping "Premium Data Unavailable": ${skippedPremium.length} (kept ${properties.length} of ${before})`);
  }

  console.log(`🔄 Mode: ${DRY_RUN ? 'DRY-RUN (no leads created)' : 'COMMIT (creating leads)'}`);
  console.log(`📦 Source list: ${LIST_NAME}`);
  console.log(`🏷️  Tags: ${TAGS.join(', ')}`);
  console.log(`🏠 Properties to import: ${properties.length}\n`);

  const built = properties.map(buildLoftyPayload);
  writeFileSync(
    resolve(DATA_DIR, `${OUT_PREFIX}-built-payloads.json`),
    JSON.stringify(
      built.map((b) => ({
        addressId: b.prop.fullAddressId,
        name: `${b.name.firstName} ${b.name.lastName || ''}`.trim(),
        phones: b.phones,
        emails: b.emails,
        payload: b.payload,
      })),
      null,
      2,
    ),
  );

  const withPhones = built.filter((b) => b.phones.length).length;
  const withEmails = built.filter((b) => b.emails.length).length;
  console.log(`📊 Enrichment: ${withPhones}/${built.length} have phones, ${withEmails}/${built.length} have emails\n`);

  const results = { created: [], skipped: [], failed: [] };
  let i = 0;
  for (const b of built) {
    i += 1;
    const label = `${b.name.firstName} ${b.name.lastName || ''}`.trim() || `address ${b.prop.fullAddressId}`;
    process.stdout.write(`   [${i}/${built.length}] ${label} — `);

    if (DRY_RUN) {
      console.log(`PREVIEW [${b.phones.length} phones, ${b.emails.length} emails]`);
      results.skipped.push({ label, reason: 'dry-run', phones: b.phones, emails: b.emails });
      continue;
    }

    const existing = await loftyFindByContact(env.LOFTY_API_KEY, b.phones, b.emails);
    if (existing.length) {
      console.log(`SKIP (exists in Lofty: ${existing.join(',')})`);
      results.skipped.push({ label, reason: 'duplicate', loftyIds: existing });
      continue;
    }

    try {
      const body = await loftyPost(env.LOFTY_API_KEY, '/leads', b.payload);
      const leadId = body.leadId ?? body.data?.leadId ?? 'unknown';
      console.log(`✅ CREATED (Lofty ID ${leadId})`);
      results.created.push({ label, leadId: String(leadId), phones: b.phones.length, emails: b.emails.length });
    } catch (err) {
      console.log(`❌ FAILED — ${err.message}`);
      results.failed.push({ label, error: err.message });
    }

    await new Promise((r) => setTimeout(r, 400));
  }

  console.log('\n════════ SUMMARY ════════');
  console.log(`Created : ${results.created.length}`);
  console.log(`Skipped : ${results.skipped.length}`);
  console.log(`Failed  : ${results.failed.length}`);

  writeFileSync(
    resolve(DATA_DIR, `${OUT_PREFIX}-import-results.json`),
    JSON.stringify({ dryRun: DRY_RUN, listName: LIST_NAME, tags: TAGS, skippedPremium, results }, null, 2),
  );
  console.log(`\n📄 Results written to data/${OUT_PREFIX}-import-results.json`);
}

main().catch((err) => {
  console.error('\n❌ Fatal:', err.message);
  process.exit(1);
});

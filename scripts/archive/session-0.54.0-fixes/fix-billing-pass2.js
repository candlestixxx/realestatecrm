/**
 * Pass 2 of the billing/schema alignment:
 *   - add `stripeCustomerId` to Workspace (the webhook persists it)
 *   - remap remaining `prisma.organization` in packages/api/src/routes/billing.ts
 *
 * Idempotent.
 */
const fs = require('fs');
const path = require('path');

const root = __dirname;

// --- schema: stripeCustomerId --------------------------------------------
const schemaPath = path.join(root, 'packages/database/prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');
if (!/stripeCustomerId\s+String/.test(schema)) {
  const anchor = 'subscriptionStatus String  @default("active") // active | trialing | past_due | canceled';
  const idx = schema.indexOf(anchor);
  if (idx < 0) {
    console.error('subscriptionStatus anchor not found — schema drifted');
    process.exit(1);
  }
  const insert =
    anchor +
    '\n  // Stripe customer id, written when a Checkout session is created.\n' +
    '  stripeCustomerId   String? @unique';
  schema = schema.slice(0, idx) + insert + schema.slice(idx + anchor.length);
  fs.writeFileSync(schemaPath, schema);
  console.log('schema: Workspace + stripeCustomerId');
} else {
  console.log('schema: stripeCustomerId already present');
}

// --- api routes/billing.ts ------------------------------------------------
const apiBilling = path.join(root, 'packages/api/src/routes/billing.ts');
let src = fs.readFileSync(apiBilling, 'utf8');
const before = src;
src = src.replace(/\bprisma\.organization\b/g, 'prisma.workspace');
if (src !== before) {
  fs.writeFileSync(apiBilling, src);
  const n = (before.match(/\bprisma\.organization\b/g) || []).length;
  console.log(`api/routes/billing.ts: remapped ${n} prisma.organization -> prisma.workspace`);
} else {
  console.log('api/routes/billing.ts: nothing to remap');
}

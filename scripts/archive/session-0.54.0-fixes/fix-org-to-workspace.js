/**
 * Add billing fields to the Workspace model and remap prisma.organization
 * -> prisma.workspace in the Stripe webhook.
 *
 * Why: the webhook was written against a schema that had an `Organization`
 * model with `plan` / `subscriptionStatus`. The shipped schema has neither —
 * `Workspace` is the account entity and `SubscriptionPlan` is a child row.
 * Rather than leave the webhook unbuildable, extend Workspace with the two
 * billing fields the webhook actually writes, and point the calls at it.
 *
 * Idempotent. Only touches packages/database/prisma/schema.prisma and
 * packages/billing/src/stripe/webhook.ts.
 */
const fs = require('fs');
const path = require('path');

const root = __dirname;
const schemaPath = path.join(root, 'packages/database/prisma/schema.prisma');
const webhookPath = path.join(root, 'packages/billing/src/stripe/webhook.ts');

// --- schema -----------------------------------------------------------
let schema = fs.readFileSync(schemaPath, 'utf8');
if (!/subscriptionStatus\s+String/.test(schema)) {
  const anchor = 'businessType String @default("general") // real_estate | ecommerce | restaurant | general';
  const idx = schema.indexOf(anchor);
  if (idx < 0) {
    console.error('ANCHOR NOT FOUND in schema — inspect model Workspace manually');
    process.exit(1);
  }
  const insert =
    anchor +
    '\n  // Billing state written by the Stripe webhook (packages/billing). The\n' +
    '  // webhook originally targeted a nonexistent Organization model; Workspace\n' +
    '  // is the account entity, so the fields live here.\n' +
    '  plan               String  @default("FREE")\n' +
    '  subscriptionStatus String  @default("active") // active | trialing | past_due | canceled';
  schema = schema.slice(0, idx) + insert + schema.slice(idx + anchor.length);
  fs.writeFileSync(schemaPath, schema);
  console.log('schema: Workspace extended with plan + subscriptionStatus');
} else {
  console.log('schema: already has billing fields');
}

// --- webhook: organization -> workspace --------------------------------
let wh = fs.readFileSync(webhookPath, 'utf8');
const before = wh;
// Only the Prisma model accessor changes; the variable names (organizationId)
// still describe the Stripe metadata key, so leave them alone.
wh = wh.replace(/\bprisma\.organization\b/g, 'prisma.workspace');
if (wh !== before) {
  fs.writeFileSync(webhookPath, wh);
  const n = (before.match(/\bprisma\.organization\b/g) || []).length;
  console.log(`webhook: remapped ${n} prisma.organization -> prisma.workspace`);
} else {
  console.log('webhook: no prisma.organization references left');
}

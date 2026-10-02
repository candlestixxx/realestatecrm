/**
 * contentplanner build fixer — mechanical strict-mode repairs.
 *
 * Why: the monorepo was authored without `noImplicitReturns` /
 * `noUnusedParameters` / `noPropertyAccessFromIndexSignature`, so `npm run build`
 * (tsc) fails with 97 pre-existing errors. This script applies the safe,
 * reversible transforms for the bulk classes so the remaining few can be
 * fixed by hand.
 *
 * Classes handled:
 *   TS4111  process.env.FOO  ->  process.env['FOO']   (index-signature access)
 *   TS6133  unused param/local -> prefix with _       (intentionally unused)
 *   TS7030  terminal res.json/res.status -> return res.…
 *   TS7006  implicit-any param -> add explicit any
 *
 * Side effects: in-place edits under packages/. Re-runnable (idempotent).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'packages');
const stats = { env: 0, unused: 0, ret: 0, any: 0, files: 0 };

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.ts') || e.name.endsWith('.tsx')) out.push(p);
  }
  return out;
}

// --- TS4111: process.env.FOO -> process.env['FOO'] -------------------------
function fixEnvAccess(src) {
  return src.replace(/\bprocess\.env\.([A-Za-z_][A-Za-z0-9_]*)/g, (m, name) => {
    // Skip if already bracket form somehow
    stats.env++;
    return `process.env['${name}']`;
  });
}

// --- TS7030: give terminal response calls a return ------------------------
// Matches a statement-level `res.json(` / `res.status(` that is NOT already
// preceded by `return`. Anchored at line-start (with indent) so we never touch
// `return res.json(...)` or mid-expression usages.
function fixImplicitReturns(src) {
  return src.replace(
    /^([ \t]+)(res\.(?:json|status|send|end)\()/gm,
    (m, indent, call) => {
      stats.ret++;
      return `${indent}return ${call}`;
    }
  );
}

// --- TS7006: `m)` style implicit-any params in .map((m) => ...) ----------
function fixImplicitAny(src) {
  // .map((m) =>  /  .filter((m) =>  /  .forEach((m) =>
  return src.replace(/\(\(([a-z])\)\s*=>/g, (m, name) => {
    stats.any++;
    return `((${name}: any) =>`;
  });
}

// --- TS6133: unused function params -> _name ------------------------------
// Only for parameters in the specific spots tsc flagged. We take the list
// from a sidecar file (unused-params.txt, lines of "file:line:col name") so we
// don't blanket-prefix every param in the repo.
function fixUnusedParams(src, file, flagged) {
  const lines = src.split(/\r?\n/);
  for (const { line, name } of flagged) {
    const idx = line - 1;
    if (idx < 0 || idx >= lines.length) continue;
    const L = lines[idx];
    // Replace the exact identifier in param position: `(name:` or `name:`
    // only when it's not already underscored and not a property key.
    const re = new RegExp(`(?<![\\w.])(${name})(?=\\s*[:,)])`);
    if (re.test(L)) {
      lines[idx] = L.replace(re, `_${name}`);
      stats.unused++;
    }
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Load the flagged-unused list produced by parsing tsc output.
function loadUnusedList() {
  const p = path.join(__dirname, 'unused-params.json');
  if (!fs.existsSync(p)) return new Map();
  const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
  const map = new Map();
  for (const [file, items] of Object.entries(raw)) {
    map.set(path.normalize(path.join(__dirname, file)), items);
  }
  return map;
}

const unusedMap = loadUnusedList();
const files = walk(ROOT);

for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  let after = before;

  after = fixEnvAccess(after);
  after = fixImplicitReturns(after);
  after = fixImplicitAny(after);

  const rel = path.relative(__dirname, file).replace(/\\/g, '/');
  const flagged = unusedMap.get(path.normalize(file)) || unusedMap.get(rel) || [];
  if (flagged.length) after = fixUnusedParams(after, file, flagged);

  if (after !== before) {
    fs.writeFileSync(file, after);
    stats.files++;
    console.log('patched', rel);
  }
}

console.log('\n=== STATS ===');
console.log(stats);

// Fix TS4111: process.env.X must be process.env['X'] under noPropertyAccessFromIndexSignature.
const fs = require('fs');
const files = [
  'packages/social/src/providers/linkedin.ts',
  'packages/social/src/providers/twitter.ts',
  'packages/social/src/providers/meta.ts',
];
for (const f of files) {
  let src = fs.readFileSync(f, 'utf8');
  src = src.replace(/process\.env\.([A-Z_][A-Z0-9_]*)/g, (_, name) => `process.env['${name}']`);
  fs.writeFileSync(f, src);
  console.log('fixed', f);
}

/**
 * De-hardcode workspaceId='excel-legacy-team' across src/.
 *
 * Two audiences:
 *   - API route handlers (server): replace the literal fallback with
 *     DEFAULT_WORKSPACE_SLUG from @/lib/workspace-context and wire in
 *     getActiveWorkspaceSlug() where a session is already at hand.
 *   - Client components (browser): replace the literal with
 *     getClientWorkspaceSlug() / withWorkspace() / withWorkspaceBody() from
 *     @/lib/workspace-client.
 *
 * The literal remains ONLY in workspace-context.ts as DEFAULT_WORKSPACE_SLUG
 * (the intentional fallback when no cookie and no session slug exist).
 *
 * Idempotent: already-converted files are skipped.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'src');
const log = [];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

function isServerFile(rel) {
  return rel.includes('app/api/') || rel.includes('src/app/api/');
}

function ensureImport(src, importLine, from) {
  if (src.includes(from) && src.includes(importLine.split('from')[0].replace('import ', '').trim().split(',')[0].trim())) {
    // cheap check already imported something from the module
    if (src.includes(`from '${from}'`) || src.includes(`from "${from}"`)) return src;
  }
  // Insert after the last top-of-file import.
  const lines = src.split(/\r?\n/);
  let lastImport = -1;
  for (let i = 0; i < Math.min(lines.length, 40); i++) {
    if (/^import\s/.test(lines[i])) lastImport = i;
  }
  if (lastImport === -1) {
    return importLine + '\n' + src;
  }
  lines.splice(lastImport + 1, 0, importLine);
  return lines.join('\n');
}

const files = walk(ROOT);

for (const file of files) {
  const rel = path.relative(__dirname, file).replace(/\\/g, '/');
  if (rel.endsWith('lib/workspace-context.ts')) continue; // source of truth
  if (rel.endsWith('lib/workspace-client.ts')) continue;

  let src = fs.readFileSync(file, 'utf8');
  if (!src.includes('excel-legacy-team')) continue;

  const before = src;
  const server = rel.includes('/api/');

  if (server) {
    // `|| 'excel-legacy-team'`  ->  `|| DEFAULT_WORKSPACE_SLUG`
    src = src.replace(/\|\|\s*'excel-legacy-team'/g, '|| DEFAULT_WORKSPACE_SLUG');
    // bare object value `workspaceId: 'excel-legacy-team'` in server code
    src = src.replace(/workspaceId:\s*'excel-legacy-team'/g, 'workspaceId: DEFAULT_WORKSPACE_SLUG');

    if (src.includes('DEFAULT_WORKSPACE_SLUG') && !src.includes('workspace-context')) {
      src = ensureImport(
        src,
        "import { DEFAULT_WORKSPACE_SLUG } from '@/lib/workspace-context';",
        '@/lib/workspace-context'
      );
    }
  } else {
    // Client: URLSearchParams construction -> withWorkspace()
    src = src.replace(
      /new URLSearchParams\(\{\s*workspaceId:\s*'excel-legacy-team'([^}]*)\}\)/g,
      (m, rest) => {
        const cleaned = rest.replace(/^\s*,\s*/, '');
        return cleaned ? `withWorkspace({ ${cleaned.trim()} })` : 'withWorkspace()';
      }
    );
    // `?workspaceId=excel-legacy-team&foo=bar` inside a fetch URL literal
    src = src.replace(
      /([`'"])((?:[^`'"]*?)[?&])workspaceId=excel-legacy-team([^`'"]*)\1/g,
      (m, q, pre, post) => `${q}${pre}workspaceId=\${getClientWorkspaceSlug()}${post}${q}`
    );
    // Remaining object values / body fields
    src = src.replace(/workspaceId:\s*'excel-legacy-team'/g, 'workspaceId: getClientWorkspaceSlug()');

    const needsHelper =
      src.includes('getClientWorkspaceSlug') || src.includes('withWorkspace(');
    if (needsHelper && !src.includes('workspace-client')) {
      src = ensureImport(
        src,
        "import { getClientWorkspaceSlug, withWorkspace } from '@/lib/workspace-client';",
        '@/lib/workspace-client'
      );
    }
  }

  if (src !== before) {
    fs.writeFileSync(file, src);
    log.push('patched ' + rel);
  } else {
    log.push('NO-OP   ' + rel + '  (literal present but no pattern matched)');
  }
}

console.log(log.join('\n'));
const remaining = log.filter((l) => l.includes('NO-OP')).length;
console.log(`\n${log.length} files touched, ${remaining} need manual review`);

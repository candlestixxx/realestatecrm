/**
 * contentplanner web build fixer — residual type errors after the API-package
 * fixes. Only 34 errors, all mechanical or one-line shape fixes:
 *
 *   TS4111  process.env.X -> process.env['X']
 *   TS6133  unused imports -> drop
 *   TS7006  implicit-any `prev` -> annotate
 *   TS2322  Badge lacks a `ghost` variant the calendar page uses -> add it
 *   TS2345  tutorials[0] under noUncheckedIndexedAccess is T|undefined -> `!`
 *   TS2307  orphaned *-reference.tsx / legacy-* files import a CRA `../App`
 *           world that no longer exists and nothing imports them -> exclude
 *           from tsconfig (nondestructive: files stay on disk as alternates)
 *
 * Idempotent.
 */
const fs = require('fs');
const path = require('path');
const log = [];
function edit(rel, fn) {
  const p = path.join(__dirname, rel);
  const before = fs.readFileSync(p, 'utf8');
  const after = fn(before);
  if (after !== before) {
    fs.writeFileSync(p, after);
    log.push('patched ' + rel);
  } else log.push('NO-OP   ' + rel);
}

// --- TS4111: process.env.X -> process.env['X'] ---------------------------
function bracketEnv(src) {
  return src.replace(/\bprocess\.env\.([A-Za-z_][A-Za-z0-9_]*)/g, "process.env['$1']");
}

// --- TS6133: drop specific unused named imports --------------------------
function dropNamedImport(src, name) {
  // `import { a, name, b } from 'x'` -> remove `name` from the list; drop the
  // whole statement if it becomes empty.
  return src.replace(
    new RegExp(`^import \\{([^}]*?)\\b${name}\\b([^}]*?)\\} from (['"][^'"]+['"]);\\r?\\n`, 'gm'),
    (m, pre, post, mod) => {
      const names = (pre + post)
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s && s !== name);
      return names.length ? `import { ${names.join(', ')} } from ${mod};\n` : '';
    }
  );
}

// ===========================================================================
const files = [
  'src/app/campaigns/page.tsx',
  'src/app/notifications/page.tsx',
  'src/app/settings/billing/page.tsx',
  'src/lib/api.ts',
  'src/lib/auth.ts',
  'src/app/calendar/page.tsx',
  'src/app/content/page.tsx',
  'src/app/landing-pages/page.tsx',
  'src/app/learning-center/page.tsx',
  'src/components/ui/badge.tsx',
];

// env bracket + unused-import drops + one-offs
edit('src/app/campaigns/page.tsx', (s) => bracketEnv(s));
edit('src/app/notifications/page.tsx', (s) => dropNamedImport(bracketEnv(s), 'apiClient'));
edit('src/app/settings/billing/page.tsx', (s) =>
  dropNamedImport(dropNamedImport(bracketEnv(s), 'apiClient'), 'Input')
);
edit('src/lib/api.ts', (s) => bracketEnv(s));
edit('src/lib/auth.ts', (s) => bracketEnv(s));

edit('src/app/calendar/page.tsx', (s) => dropNamedImport(s, 'CardDescription'));
edit('src/app/content/page.tsx', (s) => dropNamedImport(s, 'CardDescription'));
edit('src/app/landing-pages/page.tsx', (s) => {
  // `const [pages, setPages] = ...` where `pages` is never read but setPages is.
  // Rename to _pages so the setter stays.
  return s.replace(/\bconst \[pages, /, 'const [_pages, ');
});
edit('src/app/learning-center/page.tsx', (s) => {
  let t = dropNamedImport(s, 'TrendingUp');
  // tutorials[0] under noUncheckedIndexedAccess is Tutorial | undefined;
  // the array is a non-empty literal so the element is always present.
  t = t.replace('useState<Tutorial>(tutorials[0])', 'useState<Tutorial>(tutorials[0]!)');
  return t;
});

// --- Badge: add the `ghost` variant the calendar page relies on ----------
// Why a variant rather than changing call sites: `ghost` is the standard
// shadcn "unselected / de-emphasized" look and both call sites use it with
// the same intent. Adding it keeps the vocabulary consistent with Button.
edit('src/components/ui/badge.tsx', (s) => {
  if (/ghost:/.test(s)) return s;
  return s.replace(
    /(\n\s+outline: "text-foreground",)/,
    `\n        ghost:\n          "border-transparent bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground",$1`
  );
});

// --- tsconfig: exclude orphaned legacy reference modules -----------------
// These files (*-reference.tsx, legacy-app-provider.tsx, legacy-reducer.ts,
// ai-persona-prompt.ts) import '../App', './context', './types', './reducer',
// '../../types/api' — none of which exist — and nothing in src/ imports them.
// They are preserved legacy alternates (repo retention policy), so exclude
// them from type-checking rather than deleting.
edit('tsconfig.json', (s) => {
  const cfg = JSON.parse(s);
  const extra = [
    'src/components/calendar-reference.tsx',
    'src/components/content-library-reference.tsx',
    'src/components/legacy-settings-reference.tsx',
    'src/store/legacy-app-provider.tsx',
    'src/store/legacy-reducer.ts',
    'src/lib/ai-persona-prompt.ts',
  ];
  const set = new Set(cfg.exclude || []);
  for (const e of extra) set.add(e);
  cfg.exclude = [...set];
  return JSON.stringify(cfg, null, 2) + '\n';
});

console.log(log.join('\n'));
console.log('\nweb fixer complete');

"""Find unused npm dependencies."""
import json
import re
from pathlib import Path

pkg = json.loads(Path('package.json').read_text(encoding='utf-8'))
deps = list(pkg.get('dependencies', {}).keys())
print(f'Dependencies: {len(deps)}')

used = set()
for p in list(Path('src').rglob('*.ts')) + list(Path('src').rglob('*.tsx')):
    text = p.read_text(encoding='utf-8', errors='ignore')
    for m in re.finditer(r"from\s+['\"]([^'\"]+)['\"]", text):
        raw = m.group(1)
        if raw.startswith('.'):
            continue
        pkg_name = '/'.join(raw.split('/')[:2]) if raw.startswith('@') else raw.split('/')[0]
        used.add(pkg_name)
    for m in re.finditer(r"require\(['\"]([^'\"]+)['\"]\)", text):
        raw = m.group(1)
        if raw.startswith('.'):
            continue
        pkg_name = '/'.join(raw.split('/')[:2]) if raw.startswith('@') else raw.split('/')[0]
        used.add(pkg_name)

# Also check config files
for f in ['next.config.js', 'next.config.mjs', 'tailwind.config.ts', 'tailwind.config.js', 'postcss.config.js', 'postcss.config.mjs', 'prisma/seed.mjs']:
    p = Path(f)
    if p.exists():
        text = p.read_text(encoding='utf-8', errors='ignore')
        for m in re.finditer(r"from\s+['\"]([^'\"]+)['\"]|require\(['\"]([^'\"]+)['\"]\)", text):
            raw = m.group(1) or m.group(2)
            if raw and not raw.startswith('.'):
                pkg_name = '/'.join(raw.split('/')[:2]) if raw.startswith('@') else raw.split('/')[0]
                used.add(pkg_name)

unused = [d for d in deps if d not in used]
print(f'Unused deps: {len(unused)}')
for d in unused:
    print(f'  {d}')

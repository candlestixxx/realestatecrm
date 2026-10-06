from pathlib import Path
import os, re

base = Path('src/app/dashboard')
total = 0
with_tooltip = 0
missing = []
for root, dirs, files in os.walk(base):
    if 'page.tsx' in files:
        total += 1
        c = Path(root, 'page.tsx').read_text(encoding='utf-8')
        has = any(x in c for x in ['cursor-help', 'InfoBadge', 'Tooltip'])
        if not has:
            imports = re.findall(r"from ['\"]@/components/([^'\"]+)['\"]", c)
            for imp in imports:
                comp_path = Path('src/components') / (imp + '.tsx')
                if not comp_path.exists():
                    comp_path = Path('src/components') / (imp / 'index.tsx')
                if comp_path.exists():
                    cc = comp_path.read_text(encoding='utf-8')
                    if any(x in cc for x in ['cursor-help', 'InfoBadge', 'Tooltip']):
                        has = True
                        break
        if has:
            with_tooltip += 1
        else:
            rel = Path(root).relative_to(base)
            missing.append(str(rel))

print(f'Tooltip coverage (pages + client components): {with_tooltip}/{total}')
if missing:
    print('Still missing:')
    for m in sorted(missing):
        print(f'  {m}')

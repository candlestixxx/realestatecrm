"""Find components with .map() on dynamic (fetched) arrays without empty-state guards."""
from pathlib import Path
import re

# Constant arrays that never empty — skip these
CONSTANTS = {
    'EXAMPLE_COMMANDS', 'TRIGGER_EVENTS', 'OPERATORS', 'ACTION_TYPES',
    'LEAD_STATUSES', 'PRIORITIES', 'PROVIDERS', 'BLOCK_TYPES', 'BLOCKS',
    'STATUSES', 'TABS', 'SECTIONS', 'VIDEOS', 'NAV_ITEMS', 'MENU_ITEMS',
    'WORKFLOW_TYPES', 'ROLES', 'PERMISSIONS', 'FIELDS', 'COLUMNS',
}

comps = list(Path('src/components').rglob('*.tsx'))
comps += list(Path('src/app/dashboard').rglob('page.tsx'))

gaps = []
for p in comps:
    text = p.read_text(encoding='utf-8', errors='ignore')
    if 'fetch(' not in text and 'useEffect' not in text:
        continue
    for m in re.finditer(r'(\w+)\.map\(', text):
        arr = m.group(1)
        if arr in CONSTANTS or arr == 'prev' or arr == 'arr':
            continue
        start = max(0, m.start() - 200)
        context = text[start:m.start()]
        if f'{arr}.length' not in context and 'length === 0' not in context and 'length > 0' not in context and '?.length' not in context:
            gaps.append((str(p.name), arr))

# Deduplicate
seen = set()
unique = []
for g in gaps:
    if g not in seen:
        seen.add(g)
        unique.append(g)

print(f'Dynamic arrays with unguarded .map(): {len(unique)}')
for g in unique[:20]:
    print(f'  {g[0]} - {g[1]}.map()')

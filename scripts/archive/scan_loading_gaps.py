"""Find components that fetch but lack loading state indicators."""
from pathlib import Path
import re

comps = list(Path('src/components').rglob('*.tsx'))
gaps = []
for p in comps:
    text = p.read_text(encoding='utf-8', errors='ignore')
    if 'fetch(' not in text:
        continue
    has_loading = (
        'setLoading' in text
        or 'isLoading' in text
        or 'dataLoading' in text
        or 'loading' in text.lower()
    )
    if not has_loading:
        # Find what it fetches
        fetches = re.findall(r"fetch\(['\"`]([^'\"`]+)", text)
        gaps.append((p.name, fetches[:2] if fetches else ['?']))

print(f'Components with fetch but no loading state: {len(gaps)}')
for g in gaps[:15]:
    print(f'  {g[0]} — {g[1]}')

from pathlib import Path
import re

comps = list(Path('src/components').rglob('*.tsx'))
gaps = []
for p in comps:
    text = p.read_text(encoding='utf-8', errors='ignore')
    for m in re.finditer(r'<input\s+[^>]*>', text):
        tag = m.group(0)
        has_label = (
            'aria-label' in tag
            or 'id=' in tag
            or 'placeholder' in tag
            or 'type="hidden"' in tag
            or 'type="checkbox"' in tag
            or 'type="radio"' in tag
        )
        if not has_label:
            gaps.append((p.name, tag[:80]))

print('Inputs without label/aria-label/placeholder:', len(gaps))
for g in gaps[:10]:
    print(' ', g[0], '-', g[1])

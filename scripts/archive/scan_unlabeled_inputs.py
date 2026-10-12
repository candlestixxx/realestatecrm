from pathlib import Path
import re
count = 0
for f in Path('src/components').rglob('*.tsx'):
    text = f.read_text(encoding='utf-8', errors='ignore')
    for i, line in enumerate(text.splitlines(), 1):
        if '<input' not in line and '<select' not in line and '<textarea' not in line:
            continue
        if 'type="hidden"' in line or 'type="checkbox"' in line or 'type="radio"' in line:
            continue
        if 'aria-label' in line or 'aria-labelledby' in line:
            continue
        has_placeholder = 'placeholder=' in line
        if not has_placeholder:
            print(f'{f}:{i}: {line.strip()[:100]}')
            count += 1
print(f'--- total: {count}')

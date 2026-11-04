import re
from pathlib import Path

src = Path('src')
issues = []
for f in src.rglob('*.tsx'):
    c = f.read_text(encoding='utf-8', errors='ignore')
    # Find <input without aria-label, aria-labelledby, or placeholder
    pattern = r'<input([^>]*)>'
    for m in re.finditer(pattern, c):
        attrs = m.group(1)
        if 'type="hidden"' in attrs or 'type="checkbox"' in attrs or 'type="radio"' in attrs:
            continue
        if 'aria-label' not in attrs and 'aria-labelledby' not in attrs and 'placeholder' not in attrs and 'id=' not in attrs:
            line_num = c[:m.start()].count('\n') + 1
            issues.append((str(f), line_num))

print(f'Inputs without label/aria/placeholder: {len(issues)}')
for path, line in issues[:25]:
    print(f'  {path}:{line}')

import re
from pathlib import Path

src = Path('src')
issues = []
for f in src.rglob('*.tsx'):
    c = f.read_text(encoding='utf-8', errors='ignore')
    # Find icon-only buttons: content is just emoji/symbol
    pattern = r'<button([^>]*)>([^<]{1,6})</button>'
    for m in re.finditer(pattern, c):
        attrs = m.group(1)
        content = m.group(2).strip()
        if content and len(content) <= 4 and not content.replace(' ', '').isalpha():
            if 'aria-label' not in attrs and 'title=' not in attrs:
                line_num = c[:m.start()].count('\n') + 1
                issues.append((str(f), line_num, content))

print(f'Icon-only buttons without aria-label/title: {len(issues)}')
for path, line, content in issues[:25]:
    print(f'  {path}:{line} "{content}"')

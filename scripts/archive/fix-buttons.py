import os, re

SRC = 'src'
fixed = 0

for root, dirs, files in os.walk(SRC):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.next', '_archive')]
    for f in files:
        if not f.endswith('.tsx'):
            continue
        path = os.path.join(root, f)
        try:
            content = open(path, encoding='utf-8').read()
        except:
            continue
        original = content
        lines = content.split('\n')
        changed = False
        for i, line in enumerate(lines):
            if '<button' in line and 'type=' not in line and 'type =' not in line:
                # Check if inside a form (within 20 lines)
                prev = '\n'.join(lines[max(0,i-20):i])
                if '<form' in prev:
                    # Add type="button" after <button
                    lines[i] = line.replace('<button', '<button type="button"', 1)
                    changed = True
                    fixed += 1
        if changed:
            content = '\n'.join(lines)
            with open(path, 'w', encoding='utf-8', newline='') as f:
                f.write(content)
            print(f'Fixed: {path}')

print(f'\nTotal buttons fixed: {fixed}')

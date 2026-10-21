import os, re

SRC = 'src'
fixed = 0

for root, dirs, files in os.walk(SRC):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.next', '_archive')]
    for f in files:
        if not f.endswith(('.tsx', '.ts')):
            continue
        path = os.path.join(root, f)
        if 'test' in path.lower():
            continue
        try:
            content = open(path, encoding='utf-8').read()
        except:
            continue
        original = content
        lines = content.split('\n')
        changed = False
        for i, line in enumerate(lines):
            # Comment out console.log (preserve as comment for debugging reference)
            stripped = line.strip()
            if stripped.startswith('console.log(') or stripped.startswith('console.log ('):
                indent = line[:len(line) - len(line.lstrip())]
                lines[i] = indent + '// ' + stripped
                changed = True
                fixed += 1
        if changed:
            content = '\n'.join(lines)
            with open(path, 'w', encoding='utf-8', newline='') as f:
                f.write(content)
            print(f'Fixed: {path}')

print(f'\nTotal console.log commented out: {fixed}')

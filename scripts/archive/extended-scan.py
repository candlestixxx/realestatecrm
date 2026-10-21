import os, re

SRC = 'src'
issues = []

for root, dirs, files in os.walk(SRC):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.next', '_archive')]
    for f in files:
        if not f.endswith(('.tsx', '.ts')):
            continue
        path = os.path.join(root, f)
        try:
            content = open(path, encoding='utf-8').read()
            lines = content.split('\n')
        except:
            continue

        # Check for unused imports (imported but never used)
        import_matches = re.findall(r"import\s+(?:\w+\s*,\s*)?\{([^}]+)\}\s+from\s+['\"]([^'\"]+)['\"]", content)
        for imported_names, module in import_matches:
            names = [n.strip() for n in imported_names.split(',') if n.strip()]
            for name in names:
                # Check if name is used outside the import line
                usage_count = len(re.findall(r'\b' + re.escape(name) + r'\b', content))
                if usage_count <= 1:  # Only the import itself
                    issues.append(f'{path}: unused import "{name}" from "{module}"')

        # Check for empty return statements in components (JSX returning null without reason)
        # Check for TODO/FIXME/HACK markers
        for i, line in enumerate(lines, 1):
            if 'TODO:' in line or 'FIXME:' in line or 'HACK:' in line:
                issues.append(f'{path}:{i}: {line.strip()[:80]}')

        # Check for console.log in production code (not test/archive)
        if 'test' not in path.lower() and '_archive' not in path:
            for i, line in enumerate(lines, 1):
                if re.search(r'\bconsole\.log\(', line) and '//' not in line.split('console.log')[0]:
                    issues.append(f'{path}:{i}: console.log in production code')

print(f'=== ADDITIONAL SCAN: {len(issues)} findings ===')
for item in issues[:30]:
    print(f'  {item}')
if len(issues) > 30:
    print(f'  ... and {len(issues)-30} more')

import os, re

SRC = 'src'
issues = { 'missing_hook_imports': [], 'template_literal_bugs': [], 'unguarded_map': [], 'missing_type_button': [] }

for root, dirs, files in os.walk(SRC):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.next')]
    for f in files:
        if not f.endswith(('.tsx', '.ts')):
            continue
        path = os.path.join(root, f)
        try:
            content = open(path, encoding='utf-8').read()
            lines = content.split('\n')
        except:
            continue

        # 1. Missing React hook imports
        hooks_used = set()
        for hook in ['useState', 'useEffect', 'useRef', 'useCallback', 'useMemo', 'useTransition', 'useReducer']:
            if re.search(r'\b' + hook + r'\s*\(', content):
                hooks_used.add(hook)
        # Find the react import line
        react_import = re.search(r"import\s*\{([^}]+)\}\s*from\s*['\"]react['\"]", content)
        if react_import:
            imported = set(x.strip() for x in react_import.group(1).split(','))
            missing = hooks_used - imported
            # Also check for `import React, { ... } from 'react'` form
            react_import2 = re.search(r"import\s+React\s*,\s*\{([^}]+)\}\s*from\s*['\"]react['\"]", content)
            if react_import2:
                imported |= set(x.strip() for x in react_import2.group(1).split(','))
                missing = hooks_used - imported
            if missing:
                issues['missing_hook_imports'].append(f'{path}: missing {missing}')
        elif hooks_used:
            # Has hooks but no named import from react
            if "from 'react'" not in content and 'from "react"' not in content:
                issues['missing_hook_imports'].append(f'{path}: hooks used but no react import ({hooks_used})')

        # 2. Template literal bugs (single-quoted fetch URLs with template syntax)
        for i, line in enumerate(lines, 1):
            # fetch('...${...}...') — template syntax in single quotes
            if re.search(r"fetch\s*\(\s*'[^']*\$\{", line):
                issues['template_literal_bugs'].append(f'{path}:{i}: template syntax in single-quoted string')
            # fetch(`...${...}`) without backticks — actually fine, skip

        # 3. Unguarded .map() on potentially undefined
        for i, line in enumerate(lines, 1):
            # .map( without optional chaining and without a guard
            if re.search(r'\bdata\.\w+\.map\(', line) and '?.map(' not in line and '&&' not in line:
                # Check if there's a guard on previous lines
                prev = '\n'.join(lines[max(0,i-5):i-1])
                if 'if (' not in prev and '&&' not in prev and '??' not in prev and '?.length' not in prev:
                    issues['unguarded_map'].append(f'{path}:{i}: possible unguarded .map()')

        # 4. Non-submit buttons without type="button"
        for i, line in enumerate(lines, 1):
            if '<button' in line and 'type=' not in line and 'type =' not in line:
                # Check if it's inside a form
                prev = '\n'.join(lines[max(0,i-20):i])
                if '<form' in prev:
                    issues['missing_type_button'].append(f'{path}:{i}: button without type= inside form')

print('=== CODE QUALITY SCAN ===')
for category, items in issues.items():
    print(f'\n{category}: {len(items)} issues')
    for item in items[:15]:
        print(f'  {item}')
    if len(items) > 15:
        print(f'  ... and {len(items)-15} more')

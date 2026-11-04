"""Fix remaining localhost references in dashboard to use env vars."""
import os

replacements = {
    'http://localhost:3006': "process.env.NEXT_PUBLIC_MEDIA_WORKFLOW_URL || '#'",
    'http://localhost:3007': "process.env.NEXT_PUBLIC_FORECLOSURE_URL || '#'",
    'http://localhost:3008': "process.env.NEXT_PUBLIC_CONTENT_PLANNER_URL || '#'",
    'http://localhost:3001': "process.env.NEXT_PUBLIC_LEGACY_LEADS_URL || '#'",
    'http://localhost:3002': "process.env.NEXT_PUBLIC_LEAD_CALLER_URL || '#'",
}

fixed = 0
for root, dirs, files in os.walk('src'):
    dirs[:] = [d for d in dirs if d not in ('_archive', 'node_modules')]
    for f in files:
        if not f.endswith(('.tsx', '.ts')):
            continue
        p = os.path.join(root, f)
        with open(p, 'r', encoding='utf-8') as fh:
            content = fh.read()
        original = content
        for old, new in replacements.items():
            content = content.replace(old, new)
        if content != original:
            with open(p, 'w', encoding='utf-8') as fh:
                fh.write(content)
            print('Fixed: ' + p)
            fixed += 1

print('Total fixed: ' + str(fixed))

from pathlib import Path
import os, re

api_calls = set()
for root, dirs, files in os.walk('src'):
    for f in files:
        if f.endswith(('.tsx', '.ts')) and 'api/' not in root:
            c = Path(root, f).read_text(encoding='utf-8', errors='ignore')
            calls = re.findall(r'["\']/api/([^"\'?]+)', c)
            for call in calls:
                api_calls.add('/api/' + call)

print(f'APIs called from frontend: {len(api_calls)}')

api_routes = set()
for root, dirs, files in os.walk('src/app/api'):
    if 'route.ts' in files:
        rel = Path(root).relative_to('src/app/api')
        api = '/api/' + str(rel).replace('\\', '/')
        api_routes.add(api)

unused = api_routes - api_calls
print(f'API routes with no frontend caller: {len(unused)}')
for u in sorted(unused):
    print(f'  {u}')

"""Find API routes that handle user actions (POST/PATCH/DELETE) but have no UI trigger."""
from pathlib import Path
import re

api_routes = {}
for p in Path('src/app/api').rglob('route.ts'):
    rel = str(p.relative_to('src/app/api'))
    text = p.read_text(encoding='utf-8', errors='ignore')
    methods = []
    for m in ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']:
        if re.search(rf'export\s+async\s+function\s+{m}\b', text):
            methods.append(m)
    api_routes[rel] = methods

# Scan UI for fetch/POST/PUT/PATCH/DELETE calls
ui_text = ''
for p in list(Path('src').rglob('*.tsx')) + list(Path('src').rglob('*.ts')):
    if 'api' in str(p):
        continue
    ui_text += p.read_text(encoding='utf-8', errors='ignore')

# Check each route
missing_ui = []
for route, methods in sorted(api_routes.items()):
    # Check if any non-GET method exists (user action)
    user_methods = [m for m in methods if m != 'GET']
    if not user_methods:
        continue
    # Check if route path is referenced in UI
    # Normalize route: remove route.ts, [id] -> etc
    route_path = '/' + route.replace('/route.ts', '').replace('route.ts', '').rstrip('/')
    # Try common reference patterns
    clean = route_path.replace('[id]', '').replace('[recordId]', '').replace('[provider]', '').replace('[workflowId]', '')
    found = clean in ui_text or route_path in ui_text
    if not found:
        # Also try without brackets segments
        parts = [p for p in route_path.split('/') if not p.startswith('[')]
        partial = '/'.join(parts)
        if len(partial) > 5:
            found = partial in ui_text
    if not found:
        missing_ui.append((route_path, user_methods))

print(f'API routes with user actions but no UI reference: {len(missing_ui)}')
for r in missing_ui[:15]:
    print(f'  {r[0]} ({", ".join(r[1])})')

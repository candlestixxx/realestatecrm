import re
from pathlib import Path

# Get all API routes
api_routes = set()
for f in Path('src/app/api').rglob('route.ts'):
    rel = f.parent.relative_to('src/app/api')
    route = '/api/' + str(rel).replace('\\', '/')
    # Get HTTP methods
    c = f.read_text(encoding='utf-8', errors='ignore')
    methods = [m for m in ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] if f'export async function {m}' in c]
    api_routes.add((route, tuple(methods)))

# Get all fetch/API calls from frontend
frontend_fetches = set()
for f in Path('src').rglob('*.tsx'):
    c = f.read_text(encoding='utf-8', errors='ignore')
    for m in re.finditer(r"fetch\(['\"']([^'\"]+)", c):
        url = m.group(1)
        if url.startswith('/api/') or url.startswith('api/'):
            # Normalize dynamic segments
            url = re.sub(r'\$\{[^}]+\}', '*', url)
            url = re.sub(r"'\s*\+\s*[^+]+", '*', url)
            frontend_fetches.add(url)

print(f"API routes: {len(api_routes)}")
print(f"Frontend fetch calls: {len(frontend_fetches)}")

# API routes not referenced from frontend
api_paths = {r for r, _ in api_routes}
frontend_paths = frontend_fetches

# Normalize for comparison
def normalize(p):
    p = re.sub(r'\[.*?\]', '*', p)
    return p.rstrip('/')

api_norm = {normalize(p) for p in api_paths}
fe_norm = {normalize(p) for p in frontend_paths}

orphaned_apis = api_norm - fe_norm
# Also check partial matches (frontend might use dynamic segments differently)
really_orphaned = []
for api in sorted(orphaned_apis):
    # Check if any frontend path is a prefix
    if not any(fe.startswith(api.split('/api/')[0] if '/api/' in api else api[:20]) or api.startswith(fe[:20]) for fe in fe_norm):
        really_orphaned.append(api)

print(f"\nAPI routes not called from frontend ({len(really_orphaned)}):")
for r in really_orphaned[:30]:
    print(f"  {r}")

import os, re

# Get all API route paths
api_routes = set()
for root, dirs, files in os.walk('src/app/api'):
    if 'route.ts' in files:
        rel = os.path.relpath(root, 'src/app/api').replace(os.sep, '/')
        api_routes.add('/api/' + rel if rel != '.' else '/api')

# Search all TSX/TS files for fetch calls to /api/
fetch_targets = set()
for root, dirs, files in os.walk('src'):
    for f in files:
        if f.endswith(('.tsx', '.ts')):
            path = os.path.join(root, f)
            try:
                content = open(path, encoding='utf-8').read()
                # Find fetch('/api/...') and fetch(`/api/...`)
                matches = re.findall(r"fetch\s*\(\s*[`'\"](/api/[^`'\"$]+)", content)
                for m in matches:
                    # Normalize: strip query params and trailing slashes
                    target = m.split('?')[0].rstrip('/')
                    fetch_targets.add(target)
            except:
                pass

# Check which API routes have no UI callers
print(f'API routes: {len(api_routes)}, UI fetch targets: {len(fetch_targets)}')
print()

# For each API route, check if any fetch target matches it
# (accounting for dynamic routes like [id])
unwired = []
for route in sorted(api_routes):
    found = False
    for target in fetch_targets:
        # Direct match
        if route == target:
            found = True
            break
        # Dynamic route match: /api/leads/[id] matches /api/leads/123
        if '[id]' in route or '[slug]' in route or '[token]' in route:
            prefix = re.sub(r'\[[^\]]+\]', '', route).rstrip('/')
            if target.startswith(prefix + '/'):
                found = True
                break
        # Partial match (route is prefix of target)
        if target.startswith(route + '/'):
            found = True
            break
    if not found:
        unwired.append(route)

print(f'API routes with NO UI callers ({len(unwired)}):')
for r in unwired:
    print(f'  {r}')

# Also show what fetch targets don't match any route
print()
orphan_fetches = []
for target in sorted(fetch_targets):
    found = False
    for route in api_routes:
        if target == route:
            found = True
            break
        if '[id]' in route or '[slug]' in route or '[token]' in route:
            prefix = re.sub(r'\[[^\]]+\]', '', route).rstrip('/')
            if target.startswith(prefix + '/'):
                found = True
                break
        if target.startswith(route + '/'):
            found = True
            break
    if not found:
        orphan_fetches.append(target)

print(f'Fetch targets matching NO API route ({len(orphan_fetches)}):')
for t in orphan_fetches:
    print(f'  {t}')

from pathlib import Path
import os, re

base = Path('src/app/dashboard')
routes = set()
for root, dirs, files in os.walk(base):
    if 'page.tsx' in files:
        rel = Path(root).relative_to(base)
        route = '/dashboard' if str(rel) == '.' else '/dashboard/' + str(rel).replace('\\', '/')
        routes.add(route)

cc = Path('src/components/dashboard/CommandCenter.tsx').read_text(encoding='utf-8')
cc_hrefs = set(re.findall(r"href:\s*'([^']+)'", cc)) | set(re.findall(r'href:\s*"([^"]+)"', cc))
cc_routes = set()
for h in cc_hrefs:
    base_route = h.split('?')[0]
    cc_routes.add(base_route)

sn = Path('src/components/dashboard/SidebarNav.tsx').read_text(encoding='utf-8')
sn_hrefs = set(re.findall(r"href:\s*'([^']+)'", sn)) | set(re.findall(r'href:\s*"([^"]+)"', sn))
sn_routes = set()
for h in sn_hrefs:
    base_route = h.split('?')[0]
    sn_routes.add(base_route)

all_covered = cc_routes | sn_routes
uncovered = routes - all_covered
print(f'Total routes: {len(routes)}')
print(f'CommandCenter covers: {len(cc_routes)}')
print(f'SidebarNav covers: {len(sn_routes)}')
print(f'Union covers: {len(all_covered)}')
print(f'Uncovered:')
for u in sorted(uncovered):
    print(f'  {u}')

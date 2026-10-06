from pathlib import Path
import re

# Get all dashboard page routes
pages = set()
for f in Path('src/app/dashboard').rglob('page.tsx'):
    rel = f.parent.relative_to('src/app')
    route = '/' + str(rel).replace('\\', '/')
    pages.add(route)

# Get all routes referenced in SidebarNav
nav = Path('src/components/dashboard/SidebarNav.tsx').read_text(encoding='utf-8')
nav_hrefs = set(re.findall(r"href:\s*'(/dashboard[^']*)'", nav))

# Get all routes referenced in CommandCenter
cc = Path('src/components/dashboard/CommandCenter.tsx').read_text(encoding='utf-8')
cc_hrefs = set(re.findall(r"href:\s*'(/dashboard[^']*)'", cc))

all_linked = nav_hrefs | cc_hrefs

print(f"Dashboard pages found: {len(pages)}")
print(f"Routes in nav: {len(nav_hrefs)}")
print(f"Routes in CommandCenter: {len(cc_hrefs)}")

# Pages not linked from either
orphaned = pages - all_linked
# Filter out detail pages and redirects
orphaned = {p for p in orphaned if '[' not in p and p != '/dashboard'}
print(f"\nPages not in nav or CommandCenter ({len(orphaned)}):")
for p in sorted(orphaned):
    print(f"  {p}")

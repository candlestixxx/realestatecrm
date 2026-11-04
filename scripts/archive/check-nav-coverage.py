import os, re

# Get all dashboard page routes
pages = set()
for root, dirs, files in os.walk('src/app/dashboard'):
    if 'page.tsx' in files:
        rel = os.path.relpath(root, 'src/app/dashboard').replace(os.sep, '/')
        if rel == '.':
            pages.add('/dashboard')
        else:
            pages.add('/dashboard/' + rel)

# Get all links in CommandCenter (both JSX attr and object property syntax)
cc = open('src/components/dashboard/CommandCenter.tsx', encoding='utf-8').read()
cc_links = set(re.findall(r"href:\s*['\"](/dashboard/[^'\"]+)['\"]", cc))
cc_links |= set(re.findall(r"href=['\"](/dashboard/[^'\"]+)['\"]", cc))

# Get all links in SidebarNav
sn = open('src/components/dashboard/SidebarNav.tsx', encoding='utf-8').read()
sn_links = set(re.findall(r"href:\s*['\"](/dashboard/[^'\"]+)['\"]", sn))
sn_links |= set(re.findall(r"href=['\"](/dashboard/[^'\"]+)['\"]", sn))

# Strip query params for comparison
all_nav = set()
for link in cc_links | sn_links:
    all_nav.add(link.split('?')[0])

# Find pages not in any nav
missing = pages - all_nav
final_missing = []
for p in sorted(missing):
    found = False
    for nav in all_nav:
        if p.startswith(nav + '/') or p == nav:
            found = True
            break
    if not found:
        final_missing.append(p)

print('Pages missing from nav:', final_missing if final_missing else 'NONE')
print(f'Total pages: {len(pages)}, CC links: {len(cc_links)}, SN links: {len(sn_links)}')

# Also list all pages for reference
print('\nAll dashboard pages:')
for p in sorted(pages):
    in_cc = any(p.startswith(n) or p == n for n in cc_links)
    in_sn = any(p.startswith(n) or p == n for n in sn_links)
    marker = ''
    if not in_cc and not in_sn:
        marker = ' *** MISSING ***'
    elif not in_cc:
        marker = ' (SN only)'
    elif not in_sn:
        marker = ' (CC only)'
    print(f'  {p}{marker}')

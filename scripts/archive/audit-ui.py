"""
UI & API Audit Script — consolidated from check-nav-coverage.py, check-api-wiring.py,
check-unwired-apis.py, add-tooltips.py, find-headings.py.

Usage: python scripts/audit-ui.py [--fix]
  --fix  Batch-add tooltip markers to pages missing them
"""
import os, re, sys

SRC = 'src'
DASHBOARD = os.path.join(SRC, 'app', 'dashboard')
COMPONENTS = os.path.join(SRC, 'components')
API_DIR = os.path.join(SRC, 'app', 'api')

def get_dashboard_pages():
    pages = set()
    for root, dirs, files in os.walk(DASHBOARD):
        if 'page.tsx' in files:
            rel = os.path.relpath(root, DASHBOARD).replace(os.sep, '/')
            pages.add('/dashboard' if rel == '.' else '/dashboard/' + rel)
    return pages

def get_nav_links():
    cc_links, sn_links = set(), set()
    for fname, target in [('CommandCenter.tsx', cc_links), ('SidebarNav.tsx', sn_links)]:
        p = os.path.join(COMPONENTS, 'dashboard', fname)
        if os.path.isfile(p):
            content = open(p, encoding='utf-8').read()
            target |= set(re.findall(r"href:\s*['\"](/dashboard/[^'\"]+)['\"]", content))
            target |= set(re.findall(r"href=['\"](/dashboard/[^'\"]+)['\"]", content))
    return cc_links, sn_links

def check_nav_coverage():
    pages = get_dashboard_pages()
    cc, sn = get_nav_links()
    all_nav = {l.split('?')[0] for l in cc | sn}
    missing = []
    for p in sorted(pages):
        if not any(p.startswith(n) or p == n for n in all_nav):
            missing.append(p)
    return missing, len(pages), len(cc), len(sn)

def get_api_routes():
    routes = set()
    for root, dirs, files in os.walk(API_DIR):
        if 'route.ts' in files:
            rel = os.path.relpath(root, API_DIR).replace(os.sep, '/')
            routes.add('/api/' + rel if rel != '.' else '/api')
    return routes

def get_fetch_targets():
    targets = set()
    for root, dirs, files in os.walk(SRC):
        for f in files:
            if f.endswith(('.tsx', '.ts')):
                try:
                    content = open(os.path.join(root, f), encoding='utf-8').read()
                    for m in re.findall(r"fetch\s*\(\s*[`'\"](/api/[^`'\"$]+)", content):
                        targets.add(m.split('?')[0].rstrip('/'))
                except: pass
    return targets

def check_api_wiring():
    routes = get_api_routes()
    targets = get_fetch_targets()
    unwired = []
    for route in sorted(routes):
        found = False
        for t in targets:
            if route == t or t.startswith(route + '/'):
                found = True; break
            if '[' in route:
                prefix = re.sub(r'\[[^\]]+\]', '', route).rstrip('/')
                if prefix and t.startswith(prefix + '/'):
                    found = True; break
        if not found:
            unwired.append(route)
    return unwired, len(routes), len(targets)

def check_tooltips():
    missing = []
    for root, dirs, files in os.walk(DASHBOARD):
        if 'page.tsx' in files:
            p = os.path.join(root, 'page.tsx')
            content = open(p, encoding='utf-8').read()
            has_marker = any(k in content for k in ['cursor-help', 'title=', 'aria-label', 'Tooltip'])
            # Check child components too
            if not has_marker:
                # Check if it delegates to a client component that might have tooltips
                imports = re.findall(r"import\s+(\w+)", content)
                for imp in imports:
                    for comp_file in [os.path.join(COMPONENTS, f'{imp}.tsx'), os.path.join(COMPONENTS, 'dashboard', f'{imp}.tsx')]:
                        if os.path.isfile(comp_file):
                            cc = open(comp_file, encoding='utf-8').read()
                            if any(k in cc for k in ['cursor-help', 'title=', 'aria-label', 'Tooltip']):
                                has_marker = True; break
                if not has_marker:
                    missing.append(os.path.relpath(p, SRC))
    return missing

def main():
    fix_mode = '--fix' in sys.argv

    print('=== NAV COVERAGE ===')
    missing, total, cc, sn = check_nav_coverage()
    print(f'  Pages: {total}, CommandCenter links: {cc}, SidebarNav links: {sn}')
    if missing:
        print(f'  Missing from nav ({len(missing)}):')
        for p in missing: print(f'    {p}')
    else:
        print('  All pages covered.')

    print('\n=== API WIRING ===')
    unwired, n_routes, n_targets = check_api_wiring()
    print(f'  Routes: {n_routes}, Fetch targets: {n_targets}')
    if unwired:
        print(f'  Routes with no UI callers ({len(unwired)}):')
        for r in unwired: print(f'    {r}')

    print('\n=== TOOLTIP COVERAGE ===')
    missing_tt = check_tooltips()
    if missing_tt:
        print(f'  Pages missing tooltip markers ({len(missing_tt)}):')
        for p in missing_tt: print(f'    {p}')
    else:
        print('  All pages have tooltip markers.')

    if fix_mode and missing_tt:
        print('\n=== FIXING TOOLTIPS ===')
        # (Batch-add is done by add-tooltips.py — kept separate for safety)
        print('  Run scripts/add-tooltips.py for batch tooltip insertion.')

if __name__ == '__main__':
    main()

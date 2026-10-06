from pathlib import Path
import re

TOOLTIPS = {
    'src/app/dashboard/partners/page.tsx': ('Partner Network', 'Manage mortgage, title, insurance, and inspection partners. Track referrals, commissions, and permission levels for each partner.'),
    'src/app/dashboard/listings/page.tsx': ('MLS Listing Search', 'Search MLS listings by location, price, and property type. Create offers and track listing activity.'),
    'src/app/dashboard/social/page.tsx': ('Social Connections', 'Connect social media accounts for automated content publishing. Manage Facebook, Instagram, LinkedIn, and Twitter/X.'),
    'src/app/dashboard/audit/page.tsx': ('Audit Trail', 'Track all user actions and system events. Filter by action type, user, entity, and date range.'),
    'src/app/dashboard/leaderboard/page.tsx': ('Agent Leaderboard', 'Compare agent performance metrics including leads converted, deals closed, and revenue generated.'),
    'src/app/dashboard/map/page.tsx': ('Lead Map', 'Visualize lead locations on an interactive map. Cluster markers by proximity and filter by lead status.'),
}

for path, (heading, tooltip) in TOOLTIPS.items():
    p = Path(path)
    c = p.read_text(encoding='utf-8')
    if 'cursor-help' in c or 'InfoBadge' in c:
        print(f'ALREADY HAS TOOLTIP: {path}')
        continue

    # Find heading h1 or h2 with the text
    pattern = r'(<h[12][^>]*>)(' + re.escape(heading) + r')(</h[12]>)'
    m = re.search(pattern, c)
    if not m:
        # Try partial match
        pattern = r'(<h[12][^>]*>)([^<]*' + re.escape(heading[:20]) + r'[^<]*)(</h[12]>)'
        m = re.search(pattern, c)
    if not m:
        print(f'HEADING NOT FOUND: {path} ({heading})')
        continue

    # Build tooltip span (use double quotes for attributes to avoid escaping issues)
    badge = (
        ' <span title="' + tooltip + '"'
        ' aria-label="About this section: ' + tooltip + '"'
        ' className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[9px] text-gray-500 cursor-help ml-2 align-middle"'
        '>?</span>'
    )
    c = c[:m.end(2)] + badge + c[m.end(2):]
    p.write_text(c, encoding='utf-8')
    print(f'ADDED TOOLTIP: {path}')

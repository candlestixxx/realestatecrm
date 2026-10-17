import os, re

# Find client components used by pages missing tooltips and check their heading patterns
src = 'src'
pages = [
    'src/app/dashboard/campaigns/page.tsx',
    'src/app/dashboard/leads/page.tsx',
    'src/app/dashboard/segments/page.tsx',
    'src/app/dashboard/marketing/page.tsx',
    'src/app/dashboard/marketing/text-codes/page.tsx',
    'src/app/dashboard/reporting/analytics/page.tsx',
    'src/app/dashboard/agent-websites/page.tsx',
    'src/app/dashboard/websites/page.tsx',
    'src/app/dashboard/websites/builder/page.tsx',
    'src/app/dashboard/workflows/foreclosure-intake/page.tsx',
    'src/app/dashboard/workflows/listing-entry/page.tsx',
    'src/app/dashboard/workflows/marketing-media/page.tsx',
    'src/app/dashboard/workflows/offer-draft/page.tsx',
]

for page in pages:
    if not os.path.exists(page):
        continue
    content = open(page, encoding='utf-8').read()
    # Find client component imports
    imports = re.findall(r"import\s+(\w+)\s+from\s+['\"](@/[^'\"]+)['\"]", content)
    for name, path in imports:
        if not path.startswith('@/components'):
            continue
        comp_path = path.replace('@/', 'src/') + '.tsx'
        if not os.path.exists(comp_path):
            continue
        comp_content = open(comp_path, encoding='utf-8').read()
        has_tooltip = 'cursor-help' in comp_content or 'Tooltip' in comp_content
        headings = re.findall(r'<h[12][^>]*>([^<]+)</h[12]>', comp_content)
        print(f'{os.path.basename(os.path.dirname(page))}/{os.path.basename(page)} -> {os.path.basename(comp_path)}: tooltip={has_tooltip} headings={headings[:2]}')

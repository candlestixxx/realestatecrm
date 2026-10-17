import os, re

TOOLTIP_SPAN = '<span title="{desc}" aria-label="{desc}" className="cursor-help inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[9px] font-bold text-muted-foreground hover:bg-muted hover:text-muted-foreground transition-colors ml-1">?</span>'

fixes = {
    'src/app/dashboard/campaigns/page.tsx': ('Campaigns', 'Create and manage marketing campaigns across email, SMS, and social channels.'),
    'src/app/dashboard/leads/page.tsx': ('Leads', 'View and manage all leads. Add new leads, broadcast messages, filter by status, and track engagement.'),
    'src/app/dashboard/segments/page.tsx': ('Segments', 'Create lead segments based on criteria like location, behavior, and engagement for targeted marketing.'),
    'src/app/dashboard/marketing/page.tsx': ('Marketing', 'Marketing hub with text codes, campaigns, and promotional tools.'),
    'src/app/dashboard/marketing/text-codes/page.tsx': ('Text Codes', 'Generate and manage SMS text codes for lead capture and marketing campaigns.'),
    'src/app/dashboard/reporting/analytics/page.tsx': ('Analytics', 'View detailed analytics on lead sources, conversion rates, campaign performance, and team activity.'),
    'src/app/dashboard/agent-websites/page.tsx': ('Agent Websites', 'AI-powered agent websites with SEO blog generation, social media agents, and traditional site builders.'),
    'src/app/dashboard/websites/page.tsx': ('Websites', 'Manage and build agent websites with WYSIWYG tools and templates.'),
    'src/app/dashboard/websites/builder/page.tsx': ('Website Builder', 'Drag-and-drop website builder with block-based WYSIWYG editing.'),
    'src/app/dashboard/workflows/foreclosure-intake/page.tsx': ('Foreclosure', 'Capture Legal News foreclosure notices, preserve the raw public record, and prep for CRM sync.'),
    'src/app/dashboard/workflows/listing-entry/page.tsx': ('Listing Entry', 'Prefill listings, attach media, validate records, and prepare a clean MLS submission.'),
    'src/app/dashboard/workflows/marketing-media/page.tsx': ('Marketing Media', 'Create and manage marketing media assets including photos, videos, and promotional materials.'),
    'src/app/dashboard/workflows/offer-draft/page.tsx': ('Offer Draft', 'Draft offers with source provenance, compliance checks, review gates, and CRM writeback.'),
}

count = 0
for path, (title, desc) in fixes.items():
    if not os.path.exists(path):
        print(f'  MISSING {path}')
        continue
    content = open(path, encoding='utf-8').read()
    tooltip = TOOLTIP_SPAN.format(desc=desc)
    
    # Skip if already has tooltip
    if 'cursor-help' in content:
        print(f'  SKIP (already has tooltip) {path}')
        continue
    
    # Try exact title match in h1/h2
    pattern = r'(<h[12][^>]*>)(' + re.escape(title) + r')(</h[12]>)'
    match = re.search(pattern, content)
    if match:
        new_content = content[:match.end()] + tooltip + content[match.end():]
        open(path, 'w', encoding='utf-8').write(new_content)
        count += 1
        print(f'  OK {path}')
    else:
        # Try any h1/h2 heading
        pattern2 = r'(<h[12][^>]*>[^<]+</h[12]>)'
        match2 = re.search(pattern2, content)
        if match2:
            new_content = content[:match2.end()] + tooltip + content[match2.end():]
            open(path, 'w', encoding='utf-8').write(new_content)
            count += 1
            print(f'  OK (generic) {path}')
        else:
            print(f'  SKIP (no heading) {path}')

print(f'\nAdded tooltips to {count} pages')

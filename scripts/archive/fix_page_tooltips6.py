from pathlib import Path

# Client components to add tooltips to
TARGETS = {
    'src/components/CampaignsListClient.tsx': ('Campaigns', 'Create and manage email, SMS, and multi-step campaigns. Set up A/B testing, audience segments, and automated sequences.'),
    'src/components/IntegrationCenterClient.tsx': ('Integration Center', 'Connect third-party services including CRM systems, marketing tools, and communication platforms. Manage API keys and sync settings.'),
    'src/components/websites/WebsitesClient.tsx': ('Agent Websites', 'Build and manage your real estate websites with drag-and-drop blocks. Configure IDX search, landing pages, and SEO settings.'),
    'src/components/dashboard/SettingsTabs.tsx': ('Settings', 'Configure AI model keys, email, voice, MCP servers, integrations, and AI memory preferences.'),
}

for path, (title, tooltip) in TARGETS.items():
    p = Path(path)
    if not p.exists():
        print(f'MISSING: {path}')
        continue
    c = p.read_text(encoding='utf-8')
    if 'cursor-help' in c:
        print(f'ALREADY: {path}')
        continue

    # Find return statement
    idx = c.find('return (')
    if idx == -1:
        idx = c.find('return <')
    if idx == -1:
        print(f'NO RETURN: {path}')
        continue

    # Find first <div
    div_idx = c.find('<div', idx)
    if div_idx == -1:
        print(f'NO DIV: {path}')
        continue

    tag_end = c.find('>', div_idx)
    if tag_end == -1:
        print(f'NO TAG END: {path}')
        continue

    header = (
        '\n      <div className="flex items-center mb-4">'
        '<h1 className="text-xl font-semibold">' + title + '</h1>'
        ' <span title="' + tooltip + '"'
        ' aria-label="About this section: ' + tooltip + '"'
        ' className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[9px] text-gray-500 cursor-help ml-2 align-middle"'
        '>?</span></div>'
    )
    c = c[:tag_end + 1] + header + c[tag_end + 1:]
    p.write_text(c, encoding='utf-8')
    print(f'ADDED HEADER+TOOLTIP: {path}')

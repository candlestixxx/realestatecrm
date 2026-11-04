from pathlib import Path
import re

TARGETS = {
    'src/app/workflows/foreclosure-intake/page.tsx': ('Foreclosure Intake', 'Process distressed property leads through foreclosure workflow. Track notice of default, auction dates, and investor pipeline.'),
    'src/app/workflows/listing-entry/page.tsx': ('Listing Entry', 'Create and manage MLS listings with photos, descriptions, pricing, and property details.'),
    'src/app/workflows/marketing-media/page.tsx': ('Media Pipeline', 'Generate and process marketing media including images, videos, and social content with FFmpeg pipeline.'),
    'src/app/workflows/offer-draft/page.tsx': ('Offer Draft', 'Draft purchase offers with terms, contingencies, earnest money, and closing timeline. Generate contract documents.'),
    'src/app/dashboard/settings/ai-models/page.tsx': ('AI Model Keys', 'Configure API keys for Gemini, OpenAI, and custom model endpoints. Set default models per agent.'),
    'src/app/dashboard/settings/email/page.tsx': ('Email Settings', 'Configure email providers, SMTP settings, templates, and signature preferences.'),
    'src/app/dashboard/settings/mcp/page.tsx': ('MCP Server', 'Expose CRM tools to MCP-compatible agents (Claude, Cursor, etc.). Control which tools external agents may invoke.'),
    'src/app/dashboard/settings/ai-memory/page.tsx': ('AI Memory', 'Control what the AI remembers, learning preferences, and data retention. Export or delete your AI data.'),
    'src/app/dashboard/segments/page.tsx': ('Segments', 'Create and manage lead segments for targeted campaigns. Filter by status, source, location, and behavior.'),
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

    # Try heading match first
    pattern = r'(<h[1-3][^>]*>)(' + re.escape(title[:25]) + r'[^<]*)(</h[1-3]>)'
    m = re.search(pattern, c)
    if m:
        badge = (
            ' <span title="' + tooltip + '"'
            ' aria-label="About this section: ' + tooltip + '"'
            ' className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[9px] text-gray-500 cursor-help ml-2 align-middle"'
            '>?</span>'
        )
        c = c[:m.end(2)] + badge + c[m.end(2):]
        p.write_text(c, encoding='utf-8')
        print(f'ADDED: {path}')
        continue

    # For wrapper pages, try to find the imported client component and add there
    import_match = re.search(r'from [\'"]@/components/([^\'"]+)[\'"]', c)
    if import_match:
        comp_name = import_match.group(1)
        comp_path = Path('src/components') / (comp_name + '.tsx')
        if not comp_path.exists():
            print(f'COMP NOT FOUND: {path} -> {comp_path}')
            continue
        cc = comp_path.read_text(encoding='utf-8')
        if 'cursor-help' in cc:
            print(f'COMP ALREADY HAS: {comp_path}')
            continue
        # Find return statement and first div
        idx = cc.find('return (')
        if idx == -1:
            idx = cc.find('return <')
        if idx == -1:
            print(f'COMP NO RETURN: {comp_path}')
            continue
        div_idx = cc.find('<div', idx)
        if div_idx == -1:
            print(f'COMP NO DIV: {comp_path}')
            continue
        tag_end = cc.find('>', div_idx)
        if tag_end == -1:
            continue
        header = (
            '\n      <div className="flex items-center mb-4">'
            '<h1 className="text-xl font-semibold">' + title + '</h1>'
            ' <span title="' + tooltip + '"'
            ' aria-label="About this section: ' + tooltip + '"'
            ' className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[9px] text-gray-500 cursor-help ml-2 align-middle"'
            '>?</span></div>'
        )
        cc = cc[:tag_end + 1] + header + cc[tag_end + 1:]
        comp_path.write_text(cc, encoding='utf-8')
        print(f'ADDED TO COMP: {comp_path}')
        continue

    # Last resort: add to page.tsx return
    idx = c.find('return (')
    if idx == -1:
        idx = c.find('return <')
    if idx == -1:
        print(f'NO RETURN: {path}')
        continue
    div_idx = c.find('<div', idx)
    if div_idx == -1:
        print(f'NO DIV: {path}')
        continue
    tag_end = c.find('>', div_idx)
    if tag_end == -1:
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
    print(f'ADDED TO PAGE: {path}')

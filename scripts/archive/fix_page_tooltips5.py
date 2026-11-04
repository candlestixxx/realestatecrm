from pathlib import Path

TARGETS = {
    'src/app/dashboard/chat/page.tsx': ('Team Chat', 'Private and group messaging with your team. Create channels, share files, and mention teammates for quick collaboration.'),
    'src/app/dashboard/vault/page.tsx': ('Document Vault', 'Secure document storage and sharing. Upload contracts, disclosures, inspection reports, and other transaction documents.'),
}

BADGE = (
    ' <span title="{tooltip}"'
    ' aria-label="About this section: {tooltip}"'
    ' className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[9px] text-gray-500 cursor-help ml-2 align-middle"'
    '>?</span>'
)

for path, (title, tooltip) in TARGETS.items():
    p = Path(path)
    c = p.read_text(encoding='utf-8')
    if 'cursor-help' in c:
        print(f'ALREADY: {path}')
        continue

    # Find the return statement's first div
    idx = c.find('return (')
    if idx == -1:
        idx = c.find('return <')
    if idx == -1:
        print(f'NO RETURN: {path}')
        continue

    # Find the first <div after return
    div_idx = c.find('<div', idx)
    if div_idx == -1:
        print(f'NO DIV: {path}')
        continue

    # Insert a header with tooltip just after the opening div tag
    # Find end of opening div tag
    tag_end = c.find('>', div_idx)
    if tag_end == -1:
        print(f'NO TAG END: {path}')
        continue

    badge_html = BADGE.format(tooltip=tooltip)
    header = (
        '\n      <div className="flex items-center mb-4">'
        '<h1 className="text-xl font-semibold">' + title + '</h1>'
        + badge_html +
        '</div>'
    )
    c = c[:tag_end + 1] + header + c[tag_end + 1:]
    p.write_text(c, encoding='utf-8')
    print(f'ADDED HEADER+TOOLTIP: {path}')

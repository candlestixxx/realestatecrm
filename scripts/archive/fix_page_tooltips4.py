from pathlib import Path
import re

TOOLTIPS = {
    'src/app/dashboard/calendar/page.tsx': ('Publishing Calendar', 'Schedule and manage content publishing across social media platforms. Drag-and-drop calendar view with optimal posting times.'),
    'src/app/dashboard/settings/voice/page.tsx': ('Voice & Speech Settings', 'Configure voice agent providers, API keys, speech-to-text, text-to-speech, and call recording preferences.'),
    'src/app/dashboard/chat/page.tsx': ('Team Chat', 'Private and group messaging with your team. Create channels, share files, and mention teammates for quick collaboration.'),
    'src/app/dashboard/vault/page.tsx': ('Document Vault', 'Secure document storage and sharing. Upload contracts, disclosures, inspection reports, and other transaction documents.'),
}

for path, (heading, tooltip) in TOOLTIPS.items():
    p = Path(path)
    c = p.read_text(encoding='utf-8')
    if 'cursor-help' in c:
        print(f'ALREADY: {path}')
        continue

    # Try heading match first
    pattern = r'(<h[12][^>]*>)(' + re.escape(heading[:25]) + r'[^<]*)(</h[12]>)'
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

    # For pages without headings, try to add to the first section title or top-level text
    # Look for first h1-h3 or strong title
    m2 = re.search(r'(<h[1-3][^>]*>)([^<]{3,80})(</h[1-3]>)', c)
    if m2:
        badge = (
            ' <span title="' + tooltip + '"'
            ' aria-label="About this section: ' + tooltip + '"'
            ' className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[9px] text-gray-500 cursor-help ml-2 align-middle"'
            '>?</span>'
        )
        c = c[:m2.end(2)] + badge + c[m2.end(2):]
        p.write_text(c, encoding='utf-8')
        print(f'ADDED TO H3: {path} [{m2.group(2).strip()[:30]}]')
        continue

    print(f'NO INSERT POINT: {path}')

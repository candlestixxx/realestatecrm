from pathlib import Path

for path, heading_text, tooltip in [
    ('src/app/dashboard/help-center/page.tsx', 'CRM Help Center & Training Portal', 'Searchable help articles, video tutorials, and interactive training simulations for all CRM features.'),
    ('src/app/dashboard/sync-queue/page.tsx', 'MyPlus \u2192 Lofty Sync Queue', 'Monitor MyPlus to Lofty sync operations. View sync status, retry failed syncs, and manage field mappings.'),
]:
    p = Path(path)
    c = p.read_text(encoding='utf-8')
    if 'cursor-help' in c:
        print(f'ALREADY: {path}')
        continue
    idx = c.find(heading_text)
    if idx == -1:
        print(f'NOT FOUND: {path}')
        continue
    end_tag = c.find('</h', idx)
    if end_tag == -1:
        print(f'NO END TAG: {path}')
        continue
    badge = (
        ' <span title="' + tooltip + '"'
        ' aria-label="About this section: ' + tooltip + '"'
        ' className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[9px] text-gray-500 cursor-help ml-2 align-middle"'
        '>?</span>'
    )
    c = c[:end_tag] + badge + c[end_tag:]
    p.write_text(c, encoding='utf-8')
    print(f'ADDED: {path}')

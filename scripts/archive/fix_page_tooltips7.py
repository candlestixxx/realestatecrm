from pathlib import Path

TARGETS = {
    'src/components/LeadDetailLayoutClient.tsx': ('Lead Detail', 'Complete lead profile with contact info, activity timeline, campaign enrollments, search alerts, and automation history.'),
    'src/components/DealDetailLayoutClient.tsx': ('Deal Detail', 'Full deal management with stage tracker, task list, requirements checklist, stakeholders, documents, and financial details.'),
}

for path, (title, tooltip) in TARGETS.items():
    p = Path(path)
    c = p.read_text(encoding='utf-8')
    if 'cursor-help' in c:
        print(f'ALREADY: {path}')
        continue

    # Find return ( - use the main return of the component
    # For large files, find the outermost return
    idx = c.find('return (')
    if idx == -1:
        idx = c.find('return <')
    if idx == -1:
        print(f'NO RETURN: {path}')
        continue

    # Find first <div after return
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

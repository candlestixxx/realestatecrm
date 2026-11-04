from pathlib import Path
import re

TARGETS = {
    'src/components/ContactTableClient.tsx': 'No contacts yet. Add your first contact to get started.',
    'src/components/TeamChat.tsx': 'No messages yet. Start the conversation!',
    'src/components/NotificationDropdown.tsx': 'No notifications.',
    'src/components/SearchAlertsWidget.tsx': 'No search alerts configured. Create alerts to get notified about new matches.',
    'src/components/LeadCampaignEnrollment.tsx': 'No campaign enrollments yet.',
    'src/components/LeadAutomationsWidget.tsx': 'No automations configured yet.',
    'src/components/LeadIntelligence.tsx': 'No intelligence data available yet.',
}

EMPTY_DIV = '<div className="text-center py-8 text-gray-500 text-sm">{msg}</div>'

for path, msg in TARGETS.items():
    p = Path(path)
    if not p.exists():
        print(f'MISSING: {path}')
        continue
    c = p.read_text(encoding='utf-8')
    if 'text-center py-8' in c or 'text-center py-12' in c:
        print(f'ALREADY HAS EMPTY: {path}')
        continue

    # Find first .map( occurrence and the array name
    # Patterns: arr.map(, arr?.map(, items.map(
    m = re.search(r'(\w+)\??\.(map)\(', c)
    if not m:
        print(f'NO MAP: {path}')
        continue

    arr = m.group(1)
    # Check for empty guard nearby
    start = max(0, m.start() - 300)
    before = c[start:m.start()]
    if f'{arr}.length' in before:
        print(f'ALREADY GUARDED: {path} ({arr})')
        continue

    # Strategy: find the JSX block containing the map and wrap with ternary
    # Find the opening { before the map call
    map_start = m.start()
    # Walk backward to find the opening brace of the JSX expression
    depth = 0
    open_idx = None
    for i in range(map_start - 1, max(0, map_start - 500), -1):
        if c[i] == '}':
            depth += 1
        elif c[i] == '{':
            if depth == 0:
                open_idx = i
                break
            depth -= 1

    if open_idx is None:
        print(f'NO OPEN BRACE: {path}')
        continue

    # Find matching close brace for the map call
    # Start from the opening paren of .map(
    paren_idx = c.index('(', m.end() - 1)
    depth = 0
    close_paren = None
    for i in range(paren_idx, len(c)):
        if c[i] == '(':
            depth += 1
        elif c[i] == ')':
            depth -= 1
            if depth == 0:
                close_paren = i
                break

    if close_paren is None:
        print(f'NO CLOSE PAREN: {path}')
        continue

    # Find the closing } of the JSX expression after the map
    depth = 0
    close_brace = None
    for i in range(close_paren, min(close_paren + 200, len(c))):
        if c[i] == '{':
            depth += 1
        elif c[i] == '}':
            if depth == 0:
                close_brace = i
                break
            depth -= 1

    if close_brace is None:
        print(f'NO CLOSE BRACE: {path}')
        continue

    # Now we have the JSX expression from open_idx to close_brace
    # Wrap it: {arr.length === 0 ? <empty> : <original>}
    original = c[open_idx:close_brace + 1]
    inner = original[1:-1]  # strip outer braces

    empty_div = f'<div className="text-center py-8 text-gray-500 text-sm">{msg}</div>'
    wrapped = '{' + arr + '.length === 0 ? ' + empty_div + ' : (' + inner + ')}'

    c = c[:open_idx] + wrapped + c[close_brace + 1:]
    p.write_text(c, encoding='utf-8')
    print(f'ADDED EMPTY: {path} ({arr})')

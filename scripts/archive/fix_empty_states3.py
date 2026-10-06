from pathlib import Path

TARGETS = {
    'src/components/AIChat.tsx': ('messages', 'No messages yet. Start a conversation with the AI assistant.'),
    'src/components/IntegrationCenterClient.tsx': ('filteredPartners', 'No integrations match your filter. Try a different category.'),
    'src/components/SidebarAIAssistant.tsx': ('messages', 'No messages yet. Ask the AI assistant for help.'),
}

for path, (arr, msg) in TARGETS.items():
    p = Path(path)
    c = p.read_text(encoding='utf-8')
    if 'text-center py-8' in c:
        print(f'ALREADY HAS EMPTY: {path}')
        continue

    # Find {arr.map(
    marker = '{' + arr + '.map('
    idx = c.find(marker)
    if idx == -1:
        print(f'NO MAP: {path}')
        continue

    # Find matching close brace
    depth = 0
    close_idx = None
    for i in range(idx, len(c)):
        if c[i] == '{':
            depth += 1
        elif c[i] == '}':
            depth -= 1
            if depth == 0:
                close_idx = i
                break

    if close_idx is None:
        print(f'NO CLOSE: {path}')
        continue

    inner = c[idx + 1:close_idx]  # content without outer braces
    empty_div = '<div className="text-center py-8 text-gray-500 text-sm">' + msg + '</div>'
    wrapped = '{' + arr + '.length === 0 ? ' + empty_div + ' : (' + inner + ')}'
    c = c[:idx] + wrapped + c[close_idx + 1:]
    p.write_text(c, encoding='utf-8')
    print(f'ADDED EMPTY: {path} ({arr})')

from pathlib import Path
import re

TARGETS = {
    'src/components/media-pipeline/pipeline-trigger-panel.tsx': 'No pipeline runs yet. Trigger a pipeline to see results.',
    'src/components/websites/AgentSiteChatWidget.tsx': 'No messages yet. Start a conversation!',
    'src/components/websites/AnalyticsTab.tsx': 'No analytics data yet. Data appears after your site receives visitors.',
    'src/components/websites/SEOBlogTab.tsx': 'No blog posts yet. Create your first post to improve SEO.',
    'src/components/websites/LandingPagePortalClient.tsx': 'No landing pages yet. Create one to start capturing leads.',
    'src/components/workflows/workflow-screen.tsx': 'No workflow steps configured yet.',
}

for path, msg in TARGETS.items():
    p = Path(path)
    if not p.exists():
        print(f'MISSING: {path}')
        continue
    c = p.read_text(encoding='utf-8')
    if 'text-center py-8' in c or 'text-center py-12' in c or 'length === 0' in c:
        print(f'ALREADY HAS EMPTY: {path}')
        continue

    # Find first .map( and the array name
    m = re.search(r'(\w+)\??\.\s*map\(', c)
    if not m:
        print(f'NO MAP: {path}')
        continue

    arr = m.group(1)
    # Find opening { of the JSX expression
    map_start = m.start()
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

    # Find matching close paren for map
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

    # Find closing } of JSX expression
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

    original = c[open_idx:close_brace + 1]
    inner = original[1:-1]
    empty_div = f'<div className="text-center py-8 text-gray-500 text-sm">{msg}</div>'
    wrapped = '{' + arr + '.length === 0 ? ' + empty_div + ' : (' + inner + ')}'
    c = c[:open_idx] + wrapped + c[close_brace + 1:]
    p.write_text(c, encoding='utf-8')
    print(f'ADDED EMPTY: {path} ({arr})')

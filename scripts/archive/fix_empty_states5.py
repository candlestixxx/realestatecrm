from pathlib import Path

p = Path('src/components/LeadScoreWidget.tsx')
c = p.read_text(encoding='utf-8')
if 'No score factors' in c or 'No recommendations' in c:
    print('ALREADY HAS EMPTY')
else:
    for arr, msg in [('factors', 'No score factors available.'), ('recommendations', 'No recommendations at this time.')]:
        marker = '{result.' + arr + '.map('
        idx = c.find(marker)
        if idx == -1:
            print(f'NO MAP: {arr}')
            continue
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
        if close_idx:
            inner = c[idx + 1:close_idx]
            empty_div = '<div className="text-xs text-gray-400 italic">' + msg + '</div>'
            wrapped = '{result.' + arr + '.length === 0 ? ' + empty_div + ' : (' + inner + ')}'
            c = c[:idx] + wrapped + c[close_idx + 1:]
            print(f'ADDED: {arr}')
    p.write_text(c, encoding='utf-8')

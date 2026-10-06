from pathlib import Path

p = Path('src/components/LeadContactInfoCard.tsx')
c = p.read_text(encoding='utf-8')
if 'text-center py-8' in c or 'No additional' in c:
    print('ALREADY HAS EMPTY')
else:
    for arr, msg in [
        ('additionalEmails', 'No additional emails.'),
        ('additionalPhones', 'No additional phone numbers.'),
        ('familyMembers', 'No family members added.'),
    ]:
        marker = '{' + arr + '.map('
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
            wrapped = '{' + arr + '.length === 0 ? ' + empty_div + ' : (' + inner + ')}'
            c = c[:idx] + wrapped + c[close_idx + 1:]
            print(f'ADDED EMPTY: {arr}')
    p.write_text(c, encoding='utf-8')

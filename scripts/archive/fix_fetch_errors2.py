from pathlib import Path

# AILearningMemory — deletion handler
p = Path('src/components/AILearningMemory.tsx')
c = p.read_text(encoding='utf-8')
c = c.replace(
    '''onClick={async () => {
              const res = await fetch('/api/ai/memory-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...settings, dataDeletionRequested: true }),
              });
              if (res.ok) toast.success('Data deletion request submitted');
            }}''',
    '''onClick={async () => {
              try {
                const res = await fetch('/api/ai/memory-settings', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ...settings, dataDeletionRequested: true }),
                });
                if (res.ok) toast.success('Data deletion request submitted');
                else toast.error('Deletion request failed');
              } catch { toast.error('Network error'); }
            }}''',
    1
)
p.write_text(c, encoding='utf-8')
print('AILearningMemory: deletion handler fixed')

# IDXSearchWidget
p = Path('src/components/IDXSearchWidget.tsx')
if p.exists():
    c = p.read_text(encoding='utf-8')
    old = 'const res = await fetch(`/api/idx/search?${params}`);'
    if old in c:
        c = c.replace(
            old,
            'const res = await fetch(`/api/idx/search?${params}`).catch(() => null);\n      if (!res) return;',
            1
        )
        p.write_text(c, encoding='utf-8')
        print('IDXSearchWidget: .catch added')
    else:
        print('IDXSearchWidget: pattern not found')
else:
    print('IDXSearchWidget: not found')

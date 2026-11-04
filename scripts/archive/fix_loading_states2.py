from pathlib import Path

# DealDetailLayoutClient
p = Path('src/components/DealDetailLayoutClient.tsx')
c = p.read_text(encoding='utf-8')
if 'setLoading' not in c and 'isLoading' not in c:
    # Find first useState
    import re
    m = re.search(r'const \[', c)
    if m:
        c = c[:m.start()] + 'const [dataLoading, setDataLoading] = useState(true);\n  ' + c[m.start():]
    c = c.replace('.catch(() => {});', '.catch(() => {}).finally(() => setDataLoading(false));')
    c = c.replace('.catch((e) => console.error(e));', '.catch((e) => console.error(e)).finally(() => setDataLoading(false));')
    p.write_text(c, encoding='utf-8')
    print('DealDetailLayoutClient updated')
else:
    print('DealDetailLayoutClient already has loading')

# LeadTableClient
p = Path('src/components/LeadTableClient.tsx')
c = p.read_text(encoding='utf-8')
if 'setLoading' not in c and 'isLoading' not in c:
    import re
    m = re.search(r'const \[', c)
    if m:
        c = c[:m.start()] + 'const [dataLoading, setDataLoading] = useState(true);\n  ' + c[m.start():]
    c = c.replace('.catch(() => {});', '.catch(() => {}).finally(() => setDataLoading(false));')
    c = c.replace('.catch((e) => console.error(e));', '.catch((e) => console.error(e)).finally(() => setDataLoading(false));')
    p.write_text(c, encoding='utf-8')
    print('LeadTableClient updated')
else:
    print('LeadTableClient already has loading')

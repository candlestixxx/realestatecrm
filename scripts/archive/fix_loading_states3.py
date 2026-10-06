from pathlib import Path
import re

TARGETS = [
    'src/components/dashboard/CommandCenter.tsx',
    'src/components/dashboard/WebsiteBuilder.tsx',
    'src/components/LeadAlertListener.tsx',
    'src/components/media-pipeline/image-workflow.tsx',
    'src/components/ServiceHealthGrid.tsx',
    'src/components/workflows/workflow-studio.tsx',
]

for path in TARGETS:
    p = Path(path)
    if not p.exists():
        print(f'MISSING: {path}')
        continue
    c = p.read_text(encoding='utf-8')
    if 'setDataLoading' in c:
        print(f'ALREADY HAS LOADING: {path}')
        continue

    # Add loading state before first useState
    m = re.search(r'const \[', c)
    if not m:
        print(f'NO USESTATE: {path}')
        continue
    c = c[:m.start()] + 'const [dataLoading, setDataLoading] = useState(true);\n  ' + c[m.start():]

    # Add setDataLoading(false) after fetch chains
    c = c.replace('.catch(() => {});', '.catch(() => {}).finally(() => setDataLoading(false));')
    c = c.replace('.catch((e) => console.error(e));', '.catch((e) => console.error(e)).finally(() => setDataLoading(false));')
    c = c.replace('.catch((err) => console.error(err));', '.catch((err) => console.error(err)).finally(() => setDataLoading(false));')
    c = c.replace('.catch((error) => console.error(error));', '.catch((error) => console.error(error)).finally(() => setDataLoading(false));')

    p.write_text(c, encoding='utf-8')
    print(f'ADDED LOADING STATE: {path}')

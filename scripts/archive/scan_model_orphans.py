import re
from pathlib import Path

schema = Path('prisma/schema.prisma').read_text(encoding='utf-8')
models = re.findall(r'^model\s+(\w+)', schema, re.MULTILINE)

# Check which models are referenced in dashboard pages
dashboard_refs = set()
for f in Path('src').rglob('*.tsx'):
    c = f.read_text(encoding='utf-8', errors='ignore')
    for model in models:
        # Check for prisma.model usage or capitalized model name in JSX
        if f'prisma.{model[0].lower() + model[1:]}' in c or f'prisma.{model.lower()}' in c:
            dashboard_refs.add(model)

# Also check API routes
for f in Path('src/app/api').rglob('*.ts'):
    c = f.read_text(encoding='utf-8', errors='ignore')
    for model in models:
        if f'prisma.{model[0].lower() + model[1:]}' in c or f'prisma.{model.lower()}' in c:
            dashboard_refs.add(model)

print(f"Prisma models: {len(models)}")
print(f"Models used in code: {len(dashboard_refs)}")

unused = set(models) - dashboard_refs
print(f"\nModels not referenced in code ({len(unused)}):")
for m in sorted(unused):
    print(f"  {m}")

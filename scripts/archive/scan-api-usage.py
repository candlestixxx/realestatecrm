"""Scan for API routes with no fetch() or server-action callers in src/."""
from pathlib import Path
import re

# Get all API route paths
api_dir = Path("src/app/api")
routes = []
for f in api_dir.rglob("route.ts"):
    rel = f.parent.relative_to(api_dir)
    parts = list(rel.parts)
    clean_parts = []
    for p in parts:
        if "[" in p:
            clean_parts.append(p.split("[")[0].rstrip("/"))
        else:
            clean_parts.append(p)
    clean = "/".join(clean_parts)
    if clean:
        routes.append(clean)

# Scan all ts/tsx for fetch() calls and server action imports
callers = set()
for f in Path("src").rglob("*.ts"):
    t = f.read_text(encoding="utf-8", errors="ignore")
    for m in re.finditer(r"fetch\(['\"`]/api/([^'\"`?]+)", t):
        callers.add(m.group(1).rstrip("/"))
for f in Path("src").rglob("*.tsx"):
    t = f.read_text(encoding="utf-8", errors="ignore")
    for m in re.finditer(r"fetch\(['\"`]/api/([^'\"`?]+)", t):
        callers.add(m.group(1).rstrip("/"))

# Also check lib/actions for server action callers
for f in Path("src/lib/actions").rglob("*.ts"):
    t = f.read_text(encoding="utf-8", errors="ignore")
    for m in re.finditer(r"fetch\(['\"`]/api/([^'\"`?]+)", t):
        callers.add(m.group(1).rstrip("/"))

# Check which routes have no callers
unused = []
for r in sorted(routes):
    # Match route name against caller paths
    matched = any(c.startswith(r) or r.startswith(c) for c in callers)
    if not matched:
        unused.append(r)

print(f"Total API routes: {len(routes)}")
print(f"Routes with fetch callers: {len(routes) - len(unused)}")
print(f"Routes with NO fetch callers: {len(unused)}")
for u in unused:
    print(f"  /api/{u}")

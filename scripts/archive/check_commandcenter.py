from pathlib import Path
import re

text = Path("src/components/CommandCenter.tsx").read_text(encoding="utf-8", errors="ignore")
hrefs = re.findall(r'href="([^"]+)"', text) + re.findall(r"href='([^']+)'", text)
print(f"CommandCenter tiles: {len(hrefs)}")

pages = list(Path("src/app/dashboard").rglob("page.tsx"))
routes = set()
for p in pages:
    rel = str(p.parent).replace("src\\app", "").replace("\\", "/")
    routes.add(rel)
print(f"Dashboard routes: {len(routes)}")

missing = []
for r in sorted(routes):
    found = False
    for h in hrefs:
        if r in h or h in r or r.replace("/dashboard", "") in h:
            found = True
            break
    if not found:
        missing.append(r)
print(f"Routes not in CommandCenter: {len(missing)}")
for m in missing:
    print(f"  {m}")

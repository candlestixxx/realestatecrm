import re
from pathlib import Path

c = Path('src/components/dashboard/CommandCenter.tsx').read_text(encoding='utf-8')
tiles = re.findall(r"description:\s*'([^']+)'", c)
hrefs = re.findall(r"href:\s*'([^']+)'", c)
tooltips = re.findall(r"tooltip:", c)
print(f"Feature tiles with description: {len(tiles)}")
print(f"Feature tiles with href: {len(hrefs)}")
print(f"Tooltip fields: {len(tooltips)}")

# Check SidebarNav for tooltip coverage
nav = Path('src/components/dashboard/SidebarNav.tsx').read_text(encoding='utf-8')
nav_items = re.findall(r"label:\s*'([^']+)'", nav)
nav_tips = re.findall(r"tooltip:\s*'([^']+)'", nav)
print(f"\nSidebarNav items: {len(nav_items)}")
print(f"SidebarNav tooltips: {len(nav_tips)}")

# Find nav items without tooltips
nav_blocks = re.findall(r"\{[^}]+label:\s*'([^']+)'[^}]+\}", nav)
missing = []
for item in re.finditer(r"\{([^}]+)\}", nav):
    block = item.group(1)
    if 'label:' in block and 'tooltip:' not in block:
        label_match = re.search(r"label:\s*'([^']+)'", block)
        if label_match:
            missing.append(label_match.group(1))
print(f"Nav items missing tooltip: {len(missing)}")
for m in missing[:15]:
    print(f"  - {m}")

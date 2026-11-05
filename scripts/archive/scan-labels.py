from pathlib import Path
import re

gaps = []
for f in Path("src").rglob("*.tsx"):
    t = f.read_text(encoding="utf-8", errors="ignore")
    inputs = re.findall(r'<(input|select|textarea)[^>]*>', t)
    for inp in inputs:
        has_placeholder = "placeholder=" in inp
        has_aria = "aria-label" in inp
        has_hidden = 'type="hidden"' in inp or "type='hidden'" in inp
        has_submit = 'type="submit"' in inp or "type='submit'" in inp
        if not has_placeholder and not has_aria and not has_hidden and not has_submit:
            gaps.append(str(f))
            break

print(f"Files with unlabeled inputs: {len(gaps)}")
for g in gaps[:10]:
    print(f"  {g}")

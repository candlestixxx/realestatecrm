from pathlib import Path
import re

missing = [
    "src/app/dashboard/agent-websites/page.tsx",
    "src/app/dashboard/campaigns/page.tsx",
    "src/app/dashboard/leads/page.tsx",
    "src/app/dashboard/segments/page.tsx",
    "src/app/dashboard/deals/[id]/page.tsx",
    "src/app/dashboard/leads/[id]/page.tsx",
    "src/app/dashboard/marketing/text-codes/page.tsx",
    "src/app/dashboard/reporting/analytics/page.tsx",
    "src/app/dashboard/settings/ai-memory/page.tsx",
    "src/app/dashboard/settings/ai-models/page.tsx",
    "src/app/dashboard/settings/email/page.tsx",
    "src/app/dashboard/settings/integrations/page.tsx",
    "src/app/dashboard/settings/mcp/page.tsx",
    "src/app/dashboard/websites/builder/page.tsx",
    "src/app/dashboard/workflows/foreclosure-intake/page.tsx",
    "src/app/dashboard/workflows/listing-entry/page.tsx",
    "src/app/dashboard/workflows/marketing-media/page.tsx",
    "src/app/dashboard/workflows/offer-draft/page.tsx",
]
for f in missing:
    p = Path(f)
    if not p.exists():
        print(f"{f}: NOT FOUND")
        continue
    text = p.read_text(encoding="utf-8", errors="ignore")
    is_redirect = "redirect" in text[:500].lower()
    # Check imports for client components with tooltips
    imports = re.findall(r"import\s+.*?from\s+['\"]([^'\"]+)['\"]", text)
    client_has_tip = False
    for imp in imports:
        if not imp.startswith("."):
            continue
        base = p.parent
        for try_path in [base / (imp + ".tsx"), base / (imp + ".ts"), base / imp / "index.tsx"]:
            if try_path.exists():
                ct = try_path.read_text(encoding="utf-8", errors="ignore")
                if "title=" in ct or "cursor-help" in ct:
                    client_has_tip = True
                    break
        if client_has_tip:
            break
    status = "REDIRECT" if is_redirect else ("CLIENT_HAS_TIP" if client_has_tip else "NEEDS_TIP")
    print(f"{f}: {status}")

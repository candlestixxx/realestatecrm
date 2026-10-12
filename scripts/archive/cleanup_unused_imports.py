from pathlib import Path
import re

removals = {
    "src/components/CampaignEditor.tsx": ["Eye", "MessageSquare", "UserCheck", "BarChart3", "List", "Play", "ArrowRight", "ArrowLeft"],
    "src/components/LeadAlertListener.tsx": ["BellOff"],
    "src/components/LeadTableClient.tsx": ["importLeadsBulkAction"],
    "src/components/MyPlusImportModal.tsx": ["importCsvAction"],
    "src/components/MyPlusSyncFeed.tsx": ["Clock"],
    "src/components/NotificationDropdown.tsx": ["ExternalLink"],
    "src/components/RoutingRulesWidget.tsx": ["Trash2"],
    "src/components/dashboard/CommandCenter.tsx": ["withWorkspace"],
    "src/components/dashboard/WebsiteBuilder.tsx": ["Wrench", "Plus"],
    "src/components/portal/PortalListings.tsx": ["withWorkspace"],
    "src/components/websites/WebsitesClient.tsx": ["Settings", "FileText", "ArrowLeft"],
    "src/app/dashboard/audit/page.tsx": ["getClientWorkspaceSlug"],
    "src/app/dashboard/canva/page.tsx": ["useState", "Loader2"],
    "src/app/dashboard/contracts/page.tsx": ["Plus"],
    "src/app/dashboard/data-quality/page.tsx": ["withWorkspace"],
    "src/app/dashboard/imports/page.tsx": ["TooltipContent"],
    "src/app/dashboard/leaderboard/page.tsx": ["withWorkspace"],
    "src/app/dashboard/leads/page.tsx": ["MyPlusImportModal"],
    "src/app/dashboard/marketing-studio/page.tsx": ["useState"],
    "src/app/dashboard/objections/page.tsx": ["Plus"],
    "src/app/dashboard/tasks/page.tsx": ["AppRole", "isAtLeastRole"],
}

fixed = 0
for fpath, names in removals.items():
    p = Path(fpath)
    text = p.read_text(encoding="utf-8")
    for name in names:
        text = re.sub(r'\b' + re.escape(name) + r'\s*,\s*', '', text, count=1)
        text = re.sub(r',\s*' + re.escape(name) + r'\b', '', text, count=1)
        text = re.sub(r'\{\s*' + re.escape(name) + r'\s*\}', '{}', text, count=1)
        fixed += 1
    p.write_text(text, encoding="utf-8")

print(f"Removed {fixed} unused imports across {len(removals)} files")

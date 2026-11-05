"""Add empty states to unguarded state-array .map() calls."""
from pathlib import Path

fixes = [
    ("src/components/CampaignEditor.tsx", "steps",
     "No steps yet. Add your first campaign step above."),
    ("src/components/CampaignsListClient.tsx", "myFolders",
     "No folders yet."),
    ("src/components/CampaignsListClient.tsx", "companyFolders",
     "No company folders."),
    ("src/components/EditLeadModal.tsx", "additionalPhones",
     "No additional phones."),
    ("src/components/EditLeadModal.tsx", "additionalEmails",
     "No additional emails."),
    ("src/components/EditLeadModal.tsx", "familyMembers",
     "No family members listed."),
    ("src/components/LeadTableClient.tsx", "customViews",
     "No custom views saved."),
    ("src/components/LeadTagsEditor.tsx", "tagsList",
     "No tags yet."),
    ("src/components/RoutingRulesWidget.tsx", "rules",
     "No routing rules yet. Create one to automatically assign leads."),
    ("src/components/TeamChat.tsx", "messages",
     "No messages yet. Start the conversation!"),
    ("src/components/dashboard/WebsiteBuilder.tsx", "templates",
     "No templates available."),
    ("src/components/dashboard/WebsiteBuilder.tsx", "blocks",
     "No blocks yet. Add your first content block."),
    ("src/components/websites/AICreatorTab.tsx", "chatHistory",
     "Start a conversation to generate content."),
    ("src/components/websites/SEOBlogTab.tsx", "articles",
     "No articles yet. Generate your first SEO article."),
    ("src/components/websites/SocialAgentTab.tsx", "posts",
     "No posts scheduled."),
    ("src/components/websites/WebsitesClient.tsx", "blocks",
     "No content blocks yet."),
    ("src/components/workflows/workflow-studio.tsx", "activity",
     "No recent activity."),
]

fixed = 0
for fpath, var, msg in fixes:
    p = Path(fpath)
    c = p.read_text(encoding="utf-8")
    marker = "{" + var + ".map("
    idx = c.find(marker)
    if idx < 0:
        print(f"  MISS: {fpath} {var}.map")
        continue
    # Check if already has length check within 200 chars before
    before = c[max(0, idx-300):idx]
    if var + ".length" in before:
        print(f"  SKIP (already guarded): {fpath} {var}")
        continue
    # Find matching closing brace
    depth = 0
    end = idx
    for j in range(idx, len(c)):
        if c[j] == "{":
            depth += 1
        elif c[j] == "}":
            depth -= 1
        if depth == 0:
            end = j + 1
            break
    original = c[idx:end]
    inner = original[1:-1]  # strip outer {}
    # Get indentation
    line_start = c.rfind("\n", 0, idx) + 1
    indent = ""
    for ch in c[line_start:idx]:
        if ch == " ":
            indent += ch
        else:
            break
    # Build wrapped: {var.length === 0 ? (<div>msg</div>) : (inner)}
    empty_div = '<div className="text-sm text-muted-foreground py-2">' + msg + "</div>"
    wrapped = "{" + var + ".length === 0 ? (\n" + indent + "  " + empty_div + "\n" + indent + ") : (\n" + indent + "  " + inner + "\n" + indent + ")}"
    c = c[:idx] + wrapped + c[end:]
    p.write_text(c, encoding="utf-8")
    fixed += 1
    print(f"  FIXED: {fpath} {var}.map")

print(f"--- fixed: {fixed}/{len(fixes)}")

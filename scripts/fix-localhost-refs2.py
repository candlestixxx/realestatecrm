"""Fix remaining localhost references in dashboard — round 2."""
import os

def fix_file(path, replacements):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    for old, new in replacements:
        content = content.replace(old, new)
    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print('Fixed: ' + path)
        return 1
    return 0

fixed = 0

# 1. ServiceHealthGrid — use env vars for health check URLs
fixed += fix_file('src/components/ServiceHealthGrid.tsx', [
    ("url: 'http://localhost:3000'", "url: process.env.NEXT_PUBLIC_LEADG_URL || 'http://localhost:3000'"),
    ("url: 'http://localhost:3003'", "url: process.env.NEXT_PUBLIC_CONTENT_PLANNER_URL || 'http://localhost:3003'"),
    ("url: 'http://localhost:3004'", "url: process.env.NEXT_PUBLIC_MEDIA_WORKFLOW_URL || 'http://localhost:3004'"),
    ("url: 'http://localhost:3005'", "url: process.env.NEXT_PUBLIC_LEGACY_LEADS_URL || 'http://localhost:3005'"),
])

# 2. help-center sample data — use relative URLs in demo strings
fixed += fix_file('src/app/dashboard/help-center/page.tsx', [
    ('http://localhost:3000/portal/site/', '/portal/site/'),
])

# 3. TextCodes sample data — use relative URLs
fixed += fix_file('src/components/dashboard/TextCodes.tsx', [
    ('http://localhost:3000/portal/site/', '/portal/site/'),
])

# 4. social page link
fixed += fix_file('src/app/dashboard/social/page.tsx', [
    ('href="http://localhost:3003"', 'href={process.env.NEXT_PUBLIC_CONTENT_PLANNER_URL || "#"}'),
])

# 5. WebhooksForm default
fixed += fix_file('src/app/dashboard/settings/integrations/WebhooksForm.tsx', [
    ("useState('http://localhost:3000')", "useState(typeof window !== 'undefined' ? window.location.origin : '')"),
])

print('Total fixed: ' + str(fixed))

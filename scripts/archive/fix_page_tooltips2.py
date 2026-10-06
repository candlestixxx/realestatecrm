from pathlib import Path
import re

TOOLTIPS = {
    'src/app/dashboard/agent-studio/page.tsx': ('AI Agent Studio', 'Configure AI agents for lead qualification, follow-up sequences, and automated responses. Set agent personality, knowledge base, and escalation rules.'),
    'src/app/dashboard/agentcore/page.tsx': ('AgentCore', 'Central orchestration hub for AI agents, workflows, and system monitoring. Manage agent lifecycle and view execution logs.'),
    'src/app/dashboard/approvals/page.tsx': ('Approval Workflows', 'Review and approve pending actions including offers, listings, marketing campaigns, and content. Set multi-step approval chains.'),
    'src/app/dashboard/data-quality/page.tsx': ('Data Quality Dashboard', 'Monitor data completeness, accuracy, and freshness across contacts, leads, and deals. Identify duplicates and missing fields.'),
    'src/app/dashboard/deals/page.tsx': ('Deals Pipeline', 'Track deals through your pipeline stages from initial offer to closing. Manage deal requirements, stakeholders, and timelines.'),
    'src/app/dashboard/help-center/page.tsx': ('CRM Help Center', 'Searchable help articles, video tutorials, and interactive training simulations for all CRM features.'),
    'src/app/dashboard/inbox/page.tsx': ('Unified Inbox', 'All customer communications in one place: email, SMS, voice calls, and team chat. Assign conversations and set response reminders.'),
    'src/app/dashboard/marketing-studio/page.tsx': ('Marketing Studio', 'Central hub for all marketing tools including campaigns, content planning, social media, text codes, and website builder.'),
    'src/app/dashboard/sync-queue/page.tsx': ('Sync Queue', 'Monitor MyPlus to Lofty sync operations. View sync status, retry failed syncs, and manage field mappings.'),
    'src/app/dashboard/tasks/page.tsx': ('Tasks', 'Create, assign, and track tasks across your team. Set due dates, priorities, and link tasks to leads, deals, or contacts.'),
    'src/app/dashboard/workflows/page.tsx': ('Workflows', 'Design automated workflows for lead intake, listing entry, marketing media, and offer drafting. Drag-and-drop builder with conditional logic.'),
}

for path, (heading, tooltip) in TOOLTIPS.items():
    p = Path(path)
    c = p.read_text(encoding='utf-8')
    if 'cursor-help' in c or 'InfoBadge' in c:
        print(f'ALREADY HAS TOOLTIP: {path}')
        continue

    # Find heading
    pattern = r'(<h[12][^>]*>)(' + re.escape(heading[:25]) + r'[^<]*)(</h[12]>)'
    m = re.search(pattern, c)
    if not m:
        print(f'HEADING NOT FOUND: {path} ({heading[:25]})')
        continue

    badge = (
        ' <span title="' + tooltip + '"'
        ' aria-label="About this section: ' + tooltip + '"'
        ' className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[9px] text-gray-500 cursor-help ml-2 align-middle"'
        '>?</span>'
    )
    c = c[:m.end(2)] + badge + c[m.end(2):]
    p.write_text(c, encoding='utf-8')
    print(f'ADDED TOOLTIP: {path}')

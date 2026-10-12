from pathlib import Path

# AgentCoreConsole - messages
p = Path('src/components/AgentCoreConsole.tsx')
c = p.read_text(encoding='utf-8')
c = c.replace(
    '{messages.map((msg, i) => (',
    '{messages.length === 0 ? <div className="text-center py-8 text-muted-foreground text-sm">No messages yet. Try a command above.</div> : messages.map((msg, i) => (',
    1
)
p.write_text(c, encoding='utf-8')
print('AgentCoreConsole: messages empty state added')

# AgentCoreWorkflowBuilder - workflows
p = Path('src/components/AgentCoreWorkflowBuilder.tsx')
c = p.read_text(encoding='utf-8')
c = c.replace(
    '{workflows.map(wf => {',
    '{workflows.length === 0 ? <div className="text-center py-8 text-muted-foreground text-sm">No workflows yet. Create one above.</div> : workflows.map(wf => {',
    1
)
# actions
c = c.replace(
    '{actions.map((action, idx) => (',
    '{actions.length === 0 ? <p className="text-xs text-gray-400 py-2">No actions configured.</p> : actions.map((action, idx) => (',
    1
)
p.write_text(c, encoding='utf-8')
print('AgentCoreWorkflowBuilder: workflows + actions empty states added')

# LeadDetailLayoutClient - secondaryEmails, familyMembersList
p = Path('src/components/LeadDetailLayoutClient.tsx')
c = p.read_text(encoding='utf-8')
c = c.replace(
    '{secondaryEmails.map(',
    '{secondaryEmails.length === 0 ? <p className="text-sm text-gray-400 py-2">No secondary emails.</p> : secondaryEmails.map(',
    1
)
c = c.replace(
    '{familyMembersList.map(',
    '{familyMembersList.length === 0 ? <p className="text-sm text-gray-400 py-2">No family members listed.</p> : familyMembersList.map(',
    1
)
p.write_text(c, encoding='utf-8')
print('LeadDetailLayoutClient: secondaryEmails + familyMembersList empty states added')

from pathlib import Path

p = Path('src/components/LeadDetailLayoutClient.tsx')
c = p.read_text(encoding='utf-8')

# allSegments
c = c.replace(
    '{allSegments.map(s => (',
    '{allSegments.length === 0 ? <p className="text-sm text-gray-400 py-2">No segments available.</p> : allSegments.map(s => (',
    1
)

# secondaryPhones
c = c.replace(
    '{secondaryPhones.map((ph, idx) => (',
    '{secondaryPhones.length === 0 ? <p className="text-sm text-gray-400 py-2">No secondary phones.</p> : secondaryPhones.map((ph, idx) => (',
    1
)

# lead.tasks
c = c.replace(
    'lead.tasks.map(task => (',
    '(lead.tasks || []).length === 0 ? <p className="text-sm text-gray-400 py-2">No tasks yet.</p> : lead.tasks.map(task => (',
    1
)

p.write_text(c, encoding='utf-8')
print('LeadDetailLayoutClient: 3 empty states added')

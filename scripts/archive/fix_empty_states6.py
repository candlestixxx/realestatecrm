from pathlib import Path

p = Path('src/components/DealDetailLayoutClient.tsx')
c = p.read_text(encoding='utf-8')

# expensesList
c = c.replace(
    '{expensesList.map(exp => (',
    '{expensesList.length === 0 ? <p className="text-sm text-gray-400 py-4">No expenses recorded.</p> : expensesList.map(exp => (',
    1
)

# requestedDocs
c = c.replace(
    '{requestedDocs.map(doc => (',
    '{requestedDocs.length === 0 ? <p className="text-sm text-gray-400 py-4">No documents requested.</p> : requestedDocs.map(doc => (',
    1
)

# messageLogs
c = c.replace(
    '{messageLogs.map(msg => {',
    '{messageLogs.length === 0 ? <p className="text-sm text-gray-400 py-4">No messages logged.</p> : messageLogs.map(msg => {',
    1
)

# deal.tasks
c = c.replace(
    'deal.tasks.map(task => (',
    '(deal.tasks || []).length === 0 ? <p className="text-sm text-gray-400 py-4">No tasks yet.</p> : deal.tasks.map(task => (',
    1
)

# requirements
c = c.replace(
    '{requirements.map((req: any) => (',
    '{requirements.length === 0 ? <p className="text-sm text-gray-400 py-4">No requirements listed.</p> : requirements.map((req: any) => (',
    1
)

# stakeholders
c = c.replace(
    '{stakeholders.map((s: any) => (',
    '{stakeholders.length === 0 ? <p className="text-sm text-gray-400 py-4">No stakeholders added.</p> : stakeholders.map((s: any) => (',
    1
)

p.write_text(c, encoding='utf-8')
print('DealDetailLayoutClient: 6 empty states added')

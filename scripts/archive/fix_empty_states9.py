from pathlib import Path

p = Path('src/components/LeadDetailLayoutClient.tsx')
c = p.read_text(encoding='utf-8')

c = c.replace(
    'lead.contact.deals.map(deal => (',
    '(lead.contact.deals || []).length === 0 ? <p className="text-sm text-gray-400 py-2">No deals yet.</p> : lead.contact.deals.map(deal => (',
    1
)
c = c.replace(
    '{quickPhones.map((ph, idx) => (',
    '{quickPhones.length === 0 ? <p className="text-xs text-gray-400 py-1">No phone numbers.</p> : quickPhones.map((ph, idx) => (',
    1
)
c = c.replace(
    '{quickEmails.map((em, idx) => (',
    '{quickEmails.length === 0 ? <p className="text-xs text-gray-400 py-1">No email addresses.</p> : quickEmails.map((em, idx) => (',
    1
)

p.write_text(c, encoding='utf-8')
print('LeadDetailLayoutClient: deals + quickPhones + quickEmails empty states added')

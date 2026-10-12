from pathlib import Path

# AgentProfileModal - close button
p = Path('src/components/AgentProfileModal.tsx')
c = p.read_text(encoding='utf-8')
c = c.replace(
    '<button\n            onClick={onClose}\n            className="text-muted-foreground hover:text-foreground',
    '<button\n            aria-label="Close agent profile"\n            onClick={onClose}\n            className="text-muted-foreground hover:text-foreground',
    1
)
p.write_text(c, encoding='utf-8')
print('AgentProfileModal aria-label added')

# CampaignEditor - close button
p = Path('src/components/CampaignEditor.tsx')
c = p.read_text(encoding='utf-8')
c = c.replace(
    '<button onClick={onClose} className="text-muted-foreground hover:text-foreground',
    '<button aria-label="Close campaign editor" onClick={onClose} className="text-muted-foreground hover:text-foreground',
    1
)
p.write_text(c, encoding='utf-8')
print('CampaignEditor aria-label added')

# EditLeadModal - close button
p = Path('src/components/EditLeadModal.tsx')
c = p.read_text(encoding='utf-8')
c = c.replace(
    '<button onClick={onClose} className="text-muted-foreground hover:text-foreground',
    '<button aria-label="Close edit lead form" onClick={onClose} className="text-muted-foreground hover:text-foreground',
    1
)
p.write_text(c, encoding='utf-8')
print('EditLeadModal aria-label added')

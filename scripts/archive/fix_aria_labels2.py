from pathlib import Path

p = Path('src/components/SegmentsClient.tsx')
c = p.read_text(encoding='utf-8')

c = c.replace(
    '<button onClick={() => setIsAddingLead(false)}>',
    '<button aria-label="Close add lead form" onClick={() => setIsAddingLead(false)}>',
    1
)
c = c.replace(
    '<button onClick={() => setIsSmsOpen(false)}>',
    '<button aria-label="Close SMS dialog" onClick={() => setIsSmsOpen(false)}>',
    1
)
c = c.replace(
    '<button onClick={() => setIsSmartPlanOpen(false)}>',
    '<button aria-label="Close smart plan dialog" onClick={() => setIsSmartPlanOpen(false)}>',
    1
)

p.write_text(c, encoding='utf-8')
print('SegmentsClient: 3 aria-labels added')

# VoiceSettingsClient line 212
p = Path('src/components/VoiceSettingsClient.tsx')
c = p.read_text(encoding='utf-8')
# Check line 212 area
lines = c.split('\n')
print(f'VoiceSettingsClient line 212: {lines[211].strip()[:60]}')

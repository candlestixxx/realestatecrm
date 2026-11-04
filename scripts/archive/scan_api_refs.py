from pathlib import Path
import os

questionable = [
    '/api/scoring', '/api/routing', '/api/search', '/api/search-alerts',
    '/api/voice-settings', '/api/workflow-sessions', '/api/canva',
    '/api/property-data', '/api/idx/search', '/api/export', '/api/uploads',
    '/api/crm-records', '/api/agentcore/voice-command', '/api/voice/accent-morphing',
    '/api/lead-gen/social', '/api/syndication', '/api/mls/historical',
    '/api/agents/handshake', '/api/folder-detection',
]

for q in questionable:
    found_in = []
    for root, dirs, files in os.walk('src'):
        for f in files:
            if f.endswith(('.tsx', '.ts')):
                fp = Path(root, f)
                c = fp.read_text(encoding='utf-8', errors='ignore')
                if q in c:
                    found_in.append(str(fp))
    if found_in:
        print(f'{q}: {found_in[0]}')
    else:
        print(f'{q}: NOT FOUND')

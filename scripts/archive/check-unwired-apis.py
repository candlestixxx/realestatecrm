import os, re

# Check which "unwired" API routes have UI-adjacent components that SHOULD call them
# by looking for related feature names in component/page files

routes_to_check = {
    '/api/voice-settings': ['voice-settings', 'voiceSettings', 'VoiceSettings'],
    '/api/search-alerts': ['search-alerts', 'searchAlerts', 'SearchAlert'],
    '/api/leads/[id]/qualify': ['qualify', 'qualification', 'QualifyButton'],
    '/api/leads/[id]/read': ['markRead', 'mark-read', 'readLead'],
    '/api/crm-records': ['crm-records', 'crmRecords', 'CrmRecord'],
    '/api/agentcore/voice-command': ['voice-command', 'voiceCommand', 'VoiceCommand'],
    '/api/agentcore/workflows/[id]': ['agentcore.*workflow', 'AgentCore.*Workflow'],
    '/api/integrations/content': ['integrations/content', 'integrationContent'],
    '/api/integrations/foreclosure': ['integrations/foreclosure', 'integrationForeclosure'],
    '/api/integrations/leads': ['integrations/leads', 'integrationLeads'],
    '/api/integrations/media': ['integrations/media', 'integrationMedia'],
    '/api/lead-gen/social': ['lead-gen/social', 'leadGenSocial', 'LeadGenSocial'],
}

# Scan all TSX/TS files for these keywords
for route, keywords in routes_to_check.items():
    found_in = []
    for root, dirs, files in os.walk('src'):
        for f in files:
            if f.endswith(('.tsx', '.ts')):
                path = os.path.join(root, f)
                try:
                    content = open(path, encoding='utf-8').read()
                    for kw in keywords:
                        if re.search(kw, content, re.IGNORECASE):
                            found_in.append(f'{path} ({kw})')
                            break
                except:
                    pass
    if found_in:
        print(f'\n{route}:')
        for fi in found_in[:5]:
            print(f'  {fi}')
    else:
        print(f'\n{route}: NO UI references found')

"""Find which unwired API routes are user-facing (need UI buttons/forms)."""
from pathlib import Path

# API routes that are server-to-server and DON'T need UI
SERVER_ONLY = {
    '/api/agents/handshake',
    '/api/auth/[...nextauth]',
    '/api/cron/mls-scrub',
    '/api/cron/myplusleads',
    '/api/lead-gen/social',
    '/api/leads/webhooks/[provider]',
    '/api/voice/accent-morphing',
    '/api/webhooks/voice',
    '/api/crm-records',
    '/api/crm-records/[recordId]',
}

# User-facing APIs that need UI wiring
USER_FACING = {
    '/api/canva': 'Canva design integration — button in media/marketing pages',
    '/api/export': 'Data export — Export button on lists (leads, deals, contacts)',
    '/api/folder-detection': 'Folder detection — settings toggle',
    '/api/idx': 'IDX listing data — property detail page',
    '/api/idx/search': 'IDX search — listings page search bar',
    '/api/mls/historical': 'MLS historical data — property history tab',
    '/api/property-data': 'Property data enrichment — lead/property detail',
    '/api/search': 'Global search — CommandPalette integration',
    '/api/syndication': 'Listing syndication — marketing/listings publish button',
    '/api/uploads': 'File upload — media library upload button',
    '/api/websites/templates': 'Website templates — websites/template picker',
    '/api/workflow-sessions': 'Workflow sessions — workflow session list',
    '/api/leads/[id]/qualify': 'AI lead qualification — qualify button on lead detail',
    '/api/agentcore/workflows/[id]': 'AgentCore workflow CRUD — AgentCore workflow builder',
    '/api/agentcore/voice-command': 'Voice command — AgentCore voice input',
    '/api/integrations/content': 'Content integration — marketing/content sync',
    '/api/integrations/foreclosure': 'Foreclosure integration — foreclosure sync',
    '/api/integrations/leads': 'Lead integration — lead import/sync',
    '/api/integrations/media': 'Media integration — media sync',
    '/api/integrations/trigger/content': 'Content trigger — trigger content pipeline',
    '/api/integrations/trigger/voice': 'Voice trigger — trigger voice pipeline',
    '/api/voice-settings': 'Voice settings — voice settings form',
    '/api/workflows/[workflowId]': 'Workflow CRUD — workflow editor',
}

print(f'Server-only (no UI needed): {len(SERVER_ONLY)}')
print(f'User-facing (need UI wiring): {len(USER_FACING)}')
print()
for api, desc in sorted(USER_FACING.items()):
    print(f'  {api}')
    print(f'    -> {desc}')

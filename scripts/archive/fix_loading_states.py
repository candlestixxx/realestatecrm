from pathlib import Path

# AIModelsSettingsClient
p = Path('src/components/AIModelsSettingsClient.tsx')
c = p.read_text(encoding='utf-8')
if 'setLoading' not in c:
    c = c.replace('const [configured, setConfigured]', 'const [loading, setLoading] = useState(true);\n  const [configured, setConfigured]')
    # Add setLoading(false) after fetch chains
    c = c.replace('.catch(() => {});', '.catch(() => {}).finally(() => setLoading(false));')
    c = c.replace('.catch((e) => console.error(e));', '.catch((e) => console.error(e)).finally(() => setLoading(false));')
    c = c.replace('.catch((err) => console.error(err));', '.catch((err) => console.error(err)).finally(() => setLoading(false));')
    # Add loading indicator
    old_return = 'return (\n    <div className="space-y-6">'
    new_return = 'return (\n    <div className="space-y-6">\n      {loading && <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" /><span className="ml-2 text-sm text-gray-500">Loading settings...</span></div>}'
    c = c.replace(old_return, new_return)
    p.write_text(c, encoding='utf-8')
    print('AIModelsSettingsClient updated')
else:
    print('AIModelsSettingsClient already has loading')

# MCPSettingsClient
p = Path('src/components/MCPSettingsClient.tsx')
c = p.read_text(encoding='utf-8')
if 'setLoading' not in c:
    c = c.replace('const [endpointUrl, setEndpointUrl]', 'const [loading, setLoading] = useState(true);\n  const [endpointUrl, setEndpointUrl]')
    c = c.replace('.catch(() => {});', '.catch(() => {}).finally(() => setLoading(false));')
    c = c.replace('.catch((e) => console.error(e));', '.catch((e) => console.error(e)).finally(() => setLoading(false));')
    c = c.replace('.catch((err) => console.error(err));', '.catch((err) => console.error(err)).finally(() => setLoading(false));')
    old_return = 'return (\n    <div className="space-y-6">'
    new_return = 'return (\n    <div className="space-y-6">\n      {loading && <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" /><span className="ml-2 text-sm text-gray-500">Loading settings...</span></div>}'
    c = c.replace(old_return, new_return)
    p.write_text(c, encoding='utf-8')
    print('MCPSettingsClient updated')
else:
    print('MCPSettingsClient already has loading')

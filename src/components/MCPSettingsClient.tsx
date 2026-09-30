'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const MCP_TOOLS = [
  { name: 'list_contacts', description: 'List contacts with optional search and filtering' },
  { name: 'get_contact', description: 'Get full details for a contact by ID' },
  { name: 'create_contact', description: 'Create a new contact' },
  { name: 'update_lead_status', description: 'Update a lead status' },
  { name: 'create_task', description: 'Create a follow-up task' },
  { name: 'list_tasks', description: 'List tasks with optional status filter' },
  { name: 'summarize_workspace', description: 'Get workspace summary statistics' },
  { name: 'search_contacts', description: 'Search contacts by free-text query' },
  { name: 'log_activity', description: 'Log an activity against a lead' },
];

export default function MCPSettingsClient() {
  const [endpointUrl, setEndpointUrl] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setEndpointUrl(`${window.location.origin}/api/mcp`);
    }
    // MCP_TOKEN is server-side; show masked hint
    setToken('');
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }),
      });
      const data = await res.json();
      if (data.result?.tools) {
        setTestResult({ ok: true, message: `Connected — ${data.result.tools.length} tools available` });
      } else if (data.error) {
        setTestResult({ ok: false, message: `Error: ${data.error.message}` });
      } else {
        setTestResult({ ok: false, message: 'Unexpected response format' });
      }
    } catch {
      setTestResult({ ok: false, message: 'Connection failed' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">MCP Server</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Model Context Protocol endpoint for external AI agents (Claude Desktop, Cursor, etc.).
          Uses JSON-RPC 2.0 over HTTP POST.
        </p>
      </div>

      {/* Endpoint Info */}
      <div className="bg-background border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-foreground">Connection Details</h2>

        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Endpoint URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={endpointUrl}
              className="flex-1 px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg text-foreground font-mono"
            />
            <button onClick={() => copyToClipboard(endpointUrl, 'Endpoint URL')}
              className="px-3 py-2 text-xs font-bold text-secondary border border-border rounded-lg hover:bg-muted transition-colors">
              Copy
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            MCP Token
          </label>
          <p className="text-[10px] text-muted-foreground mb-1.5">
            Set the <code className="bg-muted px-1 rounded">MCP_TOKEN</code> environment variable on the server.
            External clients authenticate with <code className="bg-muted px-1 rounded">Authorization: Bearer &lt;token&gt;</code>.
          </p>
          <div className="flex gap-2">
            <input
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Enter MCP_TOKEN value to test"
              className="flex-1 px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
            />
            <button onClick={() => setShowToken(!showToken)}
              className="px-3 py-2 text-xs font-bold text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors">
              {showToken ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Test */}
        <div>
          <button onClick={testConnection} disabled={testing}
            className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-bold rounded-lg hover:bg-secondary/90 disabled:opacity-50 transition-colors">
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          {testResult && (
            <div className={`mt-2 px-3 py-2 rounded-lg text-sm ${testResult.ok ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'}`}>
              {testResult.message}
            </div>
          )}
        </div>
      </div>

      {/* Available Tools */}
      <div className="bg-background border border-border rounded-xl p-5">
        <h2 className="text-sm font-bold text-foreground mb-3">Available MCP Tools</h2>
        <div className="grid gap-2">
          {MCP_TOOLS.map(tool => (
            <div key={tool.name} className="flex items-center justify-between px-3 py-2.5 bg-muted/30 rounded-lg">
              <div>
                <code className="text-xs font-bold text-secondary">{tool.name}</code>
                <p className="text-[11px] text-muted-foreground mt-0.5">{tool.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Client Config Example */}
      <div className="bg-background border border-border rounded-xl p-5">
        <h2 className="text-sm font-bold text-foreground mb-3">Claude Desktop Configuration Example</h2>
        <pre className="p-4 bg-muted/50 rounded-lg text-xs text-foreground overflow-x-auto font-mono border border-border">{`{
  "mcpServers": {
    "agentcore-crm": {
      "url": "${endpointUrl || 'https://your-domain.com/api/mcp'}",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_TOKEN"
      }
    }
  }
}`}</pre>
        <button onClick={() => copyToClipboard(JSON.stringify({
          mcpServers: {
            'agentcore-crm': {
              url: endpointUrl || 'https://your-domain.com/api/mcp',
              headers: { Authorization: 'Bearer YOUR_MCP_TOKEN' },
            },
          },
        }, null, 2), 'Config')}
          className="mt-2 text-xs text-secondary hover:underline font-bold">
          Copy JSON config
        </button>
      </div>
    </div>
  );
}

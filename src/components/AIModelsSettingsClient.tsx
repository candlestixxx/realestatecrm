'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface ProviderInfo {
  id: string;
  name: string;
  placeholder: string;
  docsUrl: string;
}

const PROVIDERS: ProviderInfo[] = [
  { id: 'openai', name: 'OpenAI', placeholder: 'sk-...', docsUrl: 'https://platform.openai.com/api-keys' },
  { id: 'anthropic', name: 'Anthropic', placeholder: 'sk-ant-...', docsUrl: 'https://console.anthropic.com/settings/keys' },
  { id: 'gemini', name: 'Google Gemini', placeholder: 'AIza...', docsUrl: 'https://aistudio.google.com/apikey' },
  { id: 'deepseek', name: 'DeepSeek', placeholder: 'sk-...', docsUrl: 'https://platform.deepseek.com/api_keys' },
  { id: 'qwen', name: 'Qwen', placeholder: 'sk-...', docsUrl: 'https://dashscope.console.aliyun.com/apiKey' },
];

interface ConfiguredKey {
  provider: string;
  createdAt: string;
  updatedAt: string;
}

export default function AIModelsSettingsClient() {
  const [configured, setConfigured] = useState<ConfiguredKey[]>([]);
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const loadConfigured = useCallback(async () => {
    try {
      const res = await fetch('/api/vault');
      const data = await res.json();
      setConfigured(data.configuredProviders || []);
    } catch {
      toast.error('Failed to load vault status');
    }
  }, []);

  useEffect(() => { loadConfigured(); }, [loadConfigured]);

  const isConfigured = (providerId: string) => configured.some(c => c.provider === providerId);

  const saveKey = async (providerId: string) => {
    const key = keys[providerId]?.trim();
    if (!key) { toast.error('Enter a key first'); return; }

    setSaving(providerId);
    try {
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerId, key }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(`${providerId} key stored securely`);
      setKeys(prev => ({ ...prev, [providerId]: '' }));
      loadConfigured();
    } catch {
      toast.error('Failed to store key');
    } finally {
      setSaving(null);
    }
  };

  const deleteKey = async (providerId: string) => {
    if (!confirm(`Remove the stored key for ${providerId}?`)) return;
    try {
      await fetch(`/api/vault?provider=${providerId}`, { method: 'DELETE' });
      toast.success('Key removed');
      loadConfigured();
    } catch {
      toast.error('Failed to remove key');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Model Keys</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Securely store LLM provider API keys. Keys are encrypted with AES-256-GCM and never exposed in plaintext.
        </p>
      </div>

      <div className="grid gap-4">
        {PROVIDERS.map(provider => (
          <div key={provider.id} className="bg-background border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-lg font-bold">
                  {provider.name[0]}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{provider.name}</h3>
                  <a href={provider.docsUrl} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-secondary hover:underline">
                    Get API key →
                  </a>
                </div>
              </div>
              {isConfigured(provider.id) && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/15 text-green-500 font-bold uppercase">
                    Configured
                  </span>
                  <button onClick={() => deleteKey(provider.id)}
                    className="text-xs text-red-500 hover:underline">
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="password"
                value={keys[provider.id] || ''}
                onChange={e => setKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                placeholder={isConfigured(provider.id) ? '••••••••  (enter new key to replace)' : provider.placeholder}
                className="flex-1 px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/50 text-foreground placeholder:text-muted-foreground"
              />
              <button
                onClick={() => saveKey(provider.id)}
                disabled={saving === provider.id || !keys[provider.id]?.trim()}
                className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-bold rounded-lg hover:bg-secondary/90 disabled:opacity-50 transition-colors"
              >
                {saving === provider.id ? 'Saving...' : isConfigured(provider.id) ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-muted/30 border border-border rounded-xl p-4">
        <p className="text-xs text-muted-foreground">
          🔒 Keys are encrypted using AES-256-GCM before storage. The AgentCore engine and AI features
          will automatically use the stored keys for LLM calls. At minimum, configure <strong>OpenAI</strong> for
          best results with the NL command engine.
        </p>
      </div>
    </div>
  );
}

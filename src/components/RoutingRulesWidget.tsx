'use client';
// Lead routing rules widget — manage automatic lead assignment rules via /api/routing.

import { useState, useEffect } from 'react';
import { Plus, RefreshCw, ArrowRight } from 'lucide-react';

interface RoutingRule {
  id: string;
  name: string;
  description: string | null;
  source: string | null;
  segmentId: string | null;
  agentIds: string;
  isActive: boolean;
  createdAt: string;
}

export default function RoutingRulesWidget() {
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', source: '', agentIds: '' });

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/routing');
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules || []);
      }
    } catch (e) {
      console.error('Failed to fetch routing rules:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const createRule = async () => {
    if (!form.name.trim() || !form.agentIds.trim()) return;
    try {
      const res = await fetch('/api/routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          source: form.source || null,
          agentIds: form.agentIds.split(',').map(s => s.trim()).filter(Boolean),
          isActive: true,
        }),
      });
      if (res.ok) {
        setForm({ name: '', description: '', source: '', agentIds: '' });
        setShowForm(false);
        fetchRules();
      }
    } catch (e) {
      console.error('Failed to create rule:', e);
    }
  };

  const toggleRule = async (id: string, isActive: boolean) => {
    try {
      await fetch('/api/routing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive }),
      });
      fetchRules();
    } catch (e) {
      console.error('Failed to toggle rule:', e);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-gray-700">Lead Routing Rules</h3>
        <div className="flex gap-2">
          <button onClick={fetchRules} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> New Rule
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded p-3 mb-4 space-y-2">
          <input
            type="text"
            placeholder="Rule name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full text-xs border rounded px-2 py-1.5"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full text-xs border rounded px-2 py-1.5"
          />
          <input
            type="text"
            placeholder="Source filter (e.g. zillow, website)"
            value={form.source}
            onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
            className="w-full text-xs border rounded px-2 py-1.5"
          />
          <input
            type="text"
            placeholder="Agent IDs (comma-separated)"
            value={form.agentIds}
            onChange={e => setForm(f => ({ ...f, agentIds: e.target.value }))}
            className="w-full text-xs border rounded px-2 py-1.5"
          />
          <button onClick={createRule} className="w-full bg-indigo-600 text-white text-xs py-1.5 rounded hover:bg-indigo-700">
            Create Rule
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading rules...
        </div>
      ) : rules.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          No routing rules configured. Create rules to automatically assign leads to agents.
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map(rule => (
            <div key={rule.id} className="flex items-center justify-between border rounded p-2.5">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{rule.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${rule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {rule.description && (
                  <div className="text-xs text-gray-500 mt-0.5">{rule.description}</div>
                )}
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                  {rule.source && <span className="bg-gray-100 rounded px-1.5 py-0.5">Source: {rule.source}</span>}
                  <ArrowRight className="w-3 h-3" />
                  <span>Agents: {rule.agentIds}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleRule(rule.id, !rule.isActive)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                  title={rule.isActive ? 'Deactivate' : 'Activate'}
                >
                  {rule.isActive ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

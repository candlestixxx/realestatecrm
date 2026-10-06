'use client';

// AILearningMemory — user controls for AI conversation memory, training
// preferences, and custom instructions. Why: users need to control what
// the AI remembers between sessions, set custom system prompts, and
// manage data retention — critical for privacy and personalization.

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface MemorySettings {
  rememberConversations: boolean;
  retentionDays: number;
  customInstructions: string;
  learningEnabled: boolean;
  personalizationEnabled: boolean;
  dataExportRequested: boolean;
  dataDeletionRequested: boolean;
}

export default function AILearningMemory() {
  const [settings, setSettings] = useState<MemorySettings>({
    rememberConversations: true,
    retentionDays: 30,
    customInstructions: '',
    learningEnabled: true,
    personalizationEnabled: true,
    dataExportRequested: false,
    dataDeletionRequested: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/ai/memory-settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) setSettings((prev) => ({ ...prev, ...data.settings }));
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/ai/memory-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success('AI memory settings saved');
      } else {
        toast.error('Failed to save settings');
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-border/40 pb-4">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          🧠 AI Learning & Memory Controls
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Control what your AI assistant remembers, how long it stores data, and how it learns from your interactions.
        </p>
      </div>

      {/* Conversation Memory */}
      <div className="bg-background border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-foreground">Conversation Memory</h2>
        <p className="text-xs text-muted-foreground">
          When enabled, the AI remembers past conversations to provide better context and continuity.
        </p>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-foreground">Remember conversations</label>
            <p className="text-xs text-muted-foreground">Store conversation history for context-aware responses</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, rememberConversations: !settings.rememberConversations })}
            className={
              'w-11 h-6 rounded-full transition-colors ' +
              (settings.rememberConversations ? 'bg-secondary' : 'bg-muted')
            }
            role="switch"
            aria-checked={settings.rememberConversations}
          >
            <div
              className={
                'w-5 h-5 rounded-full bg-white shadow transition-transform ' +
                (settings.rememberConversations ? 'translate-x-5' : 'translate-x-0.5')
              }
            />
          </button>
        </div>

        {settings.rememberConversations && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">
              Retention period: {settings.retentionDays} days
            </label>
            <input
              type="range"
              min="1"
              max="365"
              value={settings.retentionDays}
              onChange={(e) => setSettings({ ...settings, retentionDays: Number(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 day</span>
              <span>30 days</span>
              <span>365 days</span>
            </div>
          </div>
        )}
      </div>

      {/* Learning */}
      <div className="bg-background border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-foreground">AI Learning</h2>
        <p className="text-xs text-muted-foreground">
          Allow the AI to learn from your interactions to improve suggestions and responses over time.
        </p>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-foreground">Enable learning</label>
            <p className="text-xs text-muted-foreground">AI adapts to your workflow patterns and preferences</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, learningEnabled: !settings.learningEnabled })}
            className={
              'w-11 h-6 rounded-full transition-colors ' +
              (settings.learningEnabled ? 'bg-secondary' : 'bg-muted')
            }
            role="switch"
            aria-checked={settings.learningEnabled}
          >
            <div
              className={
                'w-5 h-5 rounded-full bg-white shadow transition-transform ' +
                (settings.learningEnabled ? 'translate-x-5' : 'translate-x-0.5')
              }
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-foreground">Personalization</label>
            <p className="text-xs text-muted-foreground">AI tailors responses to your role, brand voice, and style</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, personalizationEnabled: !settings.personalizationEnabled })}
            className={
              'w-11 h-6 rounded-full transition-colors ' +
              (settings.personalizationEnabled ? 'bg-secondary' : 'bg-muted')
            }
            role="switch"
            aria-checked={settings.personalizationEnabled}
          >
            <div
              className={
                'w-5 h-5 rounded-full bg-white shadow transition-transform ' +
                (settings.personalizationEnabled ? 'translate-x-5' : 'translate-x-0.5')
              }
            />
          </button>
        </div>
      </div>

      {/* Custom Instructions */}
      <div className="bg-background border border-border rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-bold text-foreground">Custom Instructions</h2>
        <p className="text-xs text-muted-foreground">
          Set persistent instructions the AI always follows. E.g., &quot;Always use formal tone&quot; or &quot;Focus on luxury properties&quot;.
        </p>
        <textarea
          value={settings.customInstructions}
          onChange={(e) => setSettings({ ...settings, customInstructions: e.target.value })}
          placeholder="Enter custom instructions for the AI..."
          rows={4}
          className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-background resize-none"
        />
      </div>

      {/* Data Controls */}
      <div className="bg-background border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-foreground">Data Controls</h2>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-foreground">Export my AI data</label>
            <p className="text-xs text-muted-foreground">Download all AI conversation history and learned preferences</p>
          </div>
          <button
            onClick={async () => {
              const res = await fetch('/api/ai/memory-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...settings, dataExportRequested: true }),
              });
              if (res.ok) toast.success('Data export request submitted');
            }}
            className="px-4 py-2 border border-border text-xs font-bold rounded-lg hover:bg-muted"
          >
            Request Export
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-foreground">Delete my AI data</label>
            <p className="text-xs text-muted-foreground">Permanently delete all AI conversation history and learned data</p>
          </div>
          <button
            onClick={async () => {
              if (!confirm('This permanently deletes all AI data. Continue?')) return;
              const res = await fetch('/api/ai/memory-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...settings, dataDeletionRequested: true }),
              });
              if (res.ok) toast.success('Data deletion request submitted');
            }}
            className="px-4 py-2 border border-red-500/50 text-red-500 text-xs font-bold rounded-lg hover:bg-red-500/10"
          >
            Delete Data
          </button>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2.5 bg-secondary text-secondary-foreground text-sm font-bold rounded-lg hover:bg-secondary/90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

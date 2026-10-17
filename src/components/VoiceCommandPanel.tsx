'use client';

import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Voice Command Panel — wires /api/agentcore/voice-command for mobile-style
 * natural language input. Shows parsed action + confidence alongside the raw
 * result so users can verify the system understood their intent correctly.
 */
export default function VoiceCommandPanel() {
  const [command, setCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    parsed?: { action: string; target: string; confidence: number };
    response?: string;
  } | null>(null);

  const submitCommand = async () => {
    if (!command.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/agentcore/voice-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      if (!res.ok) throw new Error('Command failed');
      const data = await res.json();
      setLastResult(data);
      toast.success('Command executed');
    } catch {
      toast.error('Failed to execute voice command');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🎤</span>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Voice Command
        </h3>
        <span
          title="Type natural-language commands like 'Text all my Hot leads about the open house' or 'Create a task for John tomorrow'. Parsed into structured CRM actions."
          aria-label="Voice commands parse natural language into structured CRM actions"
          className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[9px] text-muted-foreground cursor-help"
        >
          ?
        </span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitCommand()}
          placeholder='e.g. "Text all my Hot leads about the open house"'
          className="flex-1 px-3 py-2 text-sm bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={submitCommand}
          disabled={isLoading || !command.trim()}
          className="px-4 py-2 text-xs font-bold text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isLoading ? 'Running…' : 'Execute'}
        </button>
      </div>

      {lastResult && (
        <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border">
          {lastResult.parsed && (
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Action:
              </span>
              <span className="text-xs font-semibold text-foreground">{lastResult.parsed.action}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Target:
              </span>
              <span className="text-xs font-semibold text-foreground">{lastResult.parsed.target}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  lastResult.parsed.confidence > 0.7
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-amber-500/10 text-amber-600'
                }`}
              >
                {Math.round(lastResult.parsed.confidence * 100)}% confident
              </span>
            </div>
          )}
          {lastResult.response && (
            <p className="text-xs text-muted-foreground">{lastResult.response}</p>
          )}
        </div>
      )}
    </div>
  );
}

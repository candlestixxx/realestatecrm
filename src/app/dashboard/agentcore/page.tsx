import { Metadata } from 'next';
import AgentCoreConsole from '@/components/AgentCoreConsole';
import AgentCoreWorkflowBuilder from '@/components/AgentCoreWorkflowBuilder';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AgentCore - AI Command Center',
};

export default function AgentCorePage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AgentCore <span title="Central orchestration hub for AI agents, workflows, and system monitoring. Manage agent lifecycle and view execution logs." aria-label="About this section: Central orchestration hub for AI agents, workflows, and system monitoring. Manage agent lifecycle and view execution logs." className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[9px] text-gray-500 cursor-help ml-2 align-middle">?</span></h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered command center — natural language control, workflow automation, and MCP integration.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/settings/ai-models"
            className="px-3 py-2 text-xs font-bold text-secondary border border-border rounded-lg hover:bg-muted transition-colors"
          >
            ⚙️ AI Keys
          </Link>
          <Link
            href="/dashboard/settings/mcp"
            className="px-3 py-2 text-xs font-bold text-secondary border border-border rounded-lg hover:bg-muted transition-colors"
          >
            🔌 MCP Server
          </Link>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-background border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🧠</span>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">NL Engine</h3>
          </div>
          <p className="text-sm text-foreground">Natural language → CRM actions</p>
          <p className="text-[10px] text-muted-foreground mt-1">Rule-based with optional LLM fallback</p>
        </div>
        <div className="bg-background border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">⚡</span>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Workflows</h3>
          </div>
          <p className="text-sm text-foreground">If-this-then-that automation</p>
          <p className="text-[10px] text-muted-foreground mt-1">Triggers on leads, tasks, deals, communications</p>
        </div>
        <div className="bg-background border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🔌</span>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">MCP</h3>
          </div>
          <p className="text-sm text-foreground">9 CRM tools via JSON-RPC 2.0</p>
          <p className="text-[10px] text-muted-foreground mt-1">Connect Claude Desktop, Cursor, custom agents</p>
        </div>
      </div>

      {/* Console */}
      <AgentCoreConsole />

      {/* Workflow Builder */}
      <AgentCoreWorkflowBuilder />
    </div>
  );
}

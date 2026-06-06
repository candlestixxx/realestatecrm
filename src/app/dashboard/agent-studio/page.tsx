import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import prisma from '@/lib/prisma';
import {
  createAgentWorkflowAction,
  toggleAgentWorkflowAction,
  seedAgentWorkflowsIfEmpty,
} from '@/lib/actions/agent';
import toast from 'react-hot-toast';
import { revalidatePath } from 'next/cache';

export default async function AgentStudioPage() {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);
  const workspaceId = access.workspaceId;

  // Ensure initial seed data exists for display
  await seedAgentWorkflowsIfEmpty(workspaceId);

  const [workflows, logs] = await Promise.all([
    prisma.agentWorkflow.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.agentLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      include: { lead: { include: { contact: true } } },
      take: 20,
    }),
  ]);

  async function handleToggle(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const active = formData.get('active') === 'true';
    await toggleAgentWorkflowAction(id, !active);
    revalidatePath('/dashboard/agent-studio');
  }

  async function handleCreate(formData: FormData) {
    'use server';
    await createAgentWorkflowAction(formData);
    revalidatePath('/dashboard/agent-studio');
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Agent Studio</h1>
          <p className="text-muted-foreground">Build, monitor, and control autonomous actions taken by your CRM AI Agents.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs font-bold text-green-500 uppercase tracking-widest">
            AI Agent Online & Monitoring
          </span>
        </div>
      </div>

      {/* Grid of Workflows & Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Workflows & Workflow Builder */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Workflows */}
          <div className="bg-background border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold">Autonomous AI Workflows</h2>
            <div className="divide-y divide-border/60">
              {workflows.map(wf => (
                <div key={wf.id} className="py-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{wf.name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[9px] font-bold uppercase tracking-tight">
                        {wf.trigger}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{wf.description}</p>
                  </div>
                  
                  <form action={handleToggle}>
                    <input type="hidden" name="id" value={wf.id} />
                    <input type="hidden" name="active" value={String(wf.isActive)} />
                    <button
                      type="submit"
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${
                        wf.isActive
                          ? 'bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/15'
                          : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                      }`}
                    >
                      {wf.isActive ? 'Active' : 'Paused'}
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>

          {/* Workflow Builder Form */}
          <div className="bg-background border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold">Add AI Agent Workflow</h2>
            <p className="text-xs text-muted-foreground">Instruct your AI agent to trigger actions on certain database updates.</p>
            
            <form action={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Workflow Name</label>
                  <input required name="name" placeholder="e.g. FSBO Initial Text Outreach" className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Database Trigger</label>
                  <select name="trigger" required className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none appearance-none h-[38px]">
                    <option value="NEW_LEAD_MANUAL">On Manual Lead Created</option>
                    <option value="NEW_LEAD_ZILLOW">On Zillow Lead Created</option>
                    <option value="LEAD_STATUS_PREFORECLOSURE">On Status Preforeclosure</option>
                    <option value="LEAD_STATUS_FSBO">On Status FSBO</option>
                    <option value="MLS_ALERT_MATCHED">On MLS Search Alert Match</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Workflow Details</label>
                <textarea name="description" rows={2} placeholder="Explain what the AI does when triggered..." className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Action Commands (JSON or text)</label>
                <input name="actions" placeholder="e.g. [{'type':'SMS', 'template':'Hi'}]" className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none" />
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-lg text-xs uppercase tracking-wider hover:bg-primary/90 transition-colors shadow-lg">
                  Build AI Workflow
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Right Col: AI Agent Action Logs / Reports */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-background border border-border rounded-2xl p-6 shadow-sm space-y-4 max-h-[700px] flex flex-col">
            <div>
              <h2 className="text-lg font-bold">AI Execution Reports</h2>
              <p className="text-xs text-muted-foreground">Real-time audit log of actions taken by your autonomous agents.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {logs.map(log => (
                <div key={log.id} className="p-3 border border-border rounded-xl space-y-2 hover:bg-muted/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="px-1.5 py-0.5 bg-green-500/10 text-green-500 border border-green-500/25 rounded text-[8px] font-bold uppercase tracking-tight">
                      🤖 {log.actionType}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">{log.details}</p>
                  {log.lead && (
                    <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                      Lead: <span className="font-semibold">{log.lead.contact.firstName} {log.lead.contact.lastName}</span>
                    </div>
                  )}
                </div>
              ))}

              {logs.length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-8">No AI executions recorded yet.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

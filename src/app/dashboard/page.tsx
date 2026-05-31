import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import prisma from '@/lib/prisma';
import { AppRole, isAtLeastRole } from '@/lib/permissions';

export default async function DashboardHome() {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);
  const workspaceId = access.workspaceId;
  const userRole = access.workspaceRole;

  const [leadCount, contactCount, taskCount, deals, workspaceMembers, activeWorkflows] = await Promise.all([
    prisma.lead.count({ where: { workspaceId } }),
    prisma.contact.count({ where: { workspaceId } }),
    prisma.task.count({ where: { workspaceId, status: { not: 'DONE' } } }),
    prisma.deal.findMany({ where: { workspaceId, stage: { not: 'CLOSED_WON' } } }),
    isAtLeastRole(userRole, AppRole.BROKER) || userRole === 'ADMIN'
      ? prisma.workspaceMember.findMany({
          where: { workspaceId },
          include: { user: true },
        })
      : Promise.resolve([]),
    prisma.workflowSession.findMany({
      where: { workspaceId, status: { not: 'APPROVED' } },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { user: true },
    }),
  ]);

  const activePipelineValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your business and daily tasks.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-secondary/20 text-secondary-foreground text-xs font-bold rounded-full border border-secondary/30 uppercase tracking-wider">
            {userRole.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ... existing stats cards ... */}
        <Link
          href="/dashboard/leads?status=NEW"
          className="p-6 bg-background border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow block"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Leads</p>
              <h3 className="text-2xl font-bold mt-2">{leadCount}</h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/deals"
          className="p-6 bg-background border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow block"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Pipeline</p>
              <h3 className="text-2xl font-bold mt-2">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                }).format(activePipelineValue)}
              </h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/tasks?status=TODO"
          className="p-6 bg-background border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow block"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tasks Due</p>
              <h3 className="text-2xl font-bold mt-2">{taskCount}</h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/contacts"
          className="p-6 bg-background border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow block"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
              <h3 className="text-2xl font-bold mt-2">{contactCount}</h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
            <h2 className="text-lg font-bold">Active Workflows & Drip Campaigns</h2>
            <Link href="/dashboard/workflows" className="text-primary hover:underline text-xs font-medium">
              View All
            </Link>
          </div>
          <div className="p-4">
            {activeWorkflows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No active workflows found.</p>
            ) : (
              <div className="space-y-4">
                {activeWorkflows.map((wf) => (
                  <div key={wf.id} className="flex justify-between items-center p-3 border border-border rounded-lg bg-muted/5">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{wf.type.replace('_', ' ')}</span>
                      <span className="text-xs text-muted-foreground">Updated {new Date(wf.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <span className="px-2 py-1 bg-secondary/10 text-secondary-foreground text-[10px] font-bold rounded-full uppercase tracking-tight">
                      {wf.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/20">
            <h2 className="text-lg font-bold">AI Assistant / Gemini Sync</h2>
            <p className="text-xs text-muted-foreground mt-1">Configure your default AI for drip campaigns and workflow execution.</p>
          </div>
          <div className="p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <p className="font-medium">Gemini 2.5 Flash is Active</p>
              <p className="text-sm text-muted-foreground mt-1">Ready to automate email/SMS follow-ups and analyze lead behavior.</p>
            </div>
            <button className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors">
              Manage AI Integrations
            </button>
          </div>
        </div>
      </div>

      {workspaceMembers.length > 0 && (
        <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden mt-8">
          <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
            <h2 className="text-xl font-bold">Team Management</h2>
            <button className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 transition-colors">
              + Invite Member
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                <tr>
                  <th className="px-6 py-3 font-medium">Member</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {workspaceMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold">
                          {member.user.name?.[0] || 'U'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{member.user.name || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground">{member.user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-muted border border-border rounded text-[10px] font-bold uppercase tracking-tight">
                        {member.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        <span className="text-xs">Active</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-primary hover:underline text-xs font-medium">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

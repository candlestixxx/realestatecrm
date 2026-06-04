import { getServerSession } from 'next-auth/next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import AddActivityForm from '@/components/AddActivityForm';
import { authOptions } from '@/lib/auth';
import { createActivityAction as addActivity } from '@/lib/actions/activity';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { AppRole, isAtLeastRole } from '@/lib/permissions';

export default async function DealDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const resolvedParams = await props.params;
  const searchParams = await props.searchParams;
  const activeTab = searchParams?.tab || 'overview';

  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);
  const userRole = access.workspaceRole;

  const deal = await prisma.deal.findFirst({
    where: { id: resolvedParams.id, workspaceId: access.workspaceId },
    include: {
      contact: true,
      workspace: true,
      tasks: true,
      Activity: {
        orderBy: { createdAt: 'desc' },
      },
      WorkflowSession: {
        orderBy: { updatedAt: 'desc' },
      },
    },
  });

  if (!deal) {
    notFound();
  }

  const activeWorkflows = deal.WorkflowSession.filter((w) => w.status !== 'APPROVED');

  const tabs = [
    { id: 'overview', label: 'Overview & Activity' },
    { id: 'showings', label: 'Showings & Offers' },
    { id: 'tasks', label: 'Tasks' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/deals"
          className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1"
        >
          &larr; Back to Pipeline
        </Link>
        <span className="px-2 py-0.5 bg-secondary/10 text-secondary-foreground text-[10px] font-bold rounded border border-secondary/20 uppercase tracking-tighter">
          {userRole.replace('_', ' ')}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{deal.title}</h1>
          <p className="text-muted-foreground">Deal Detail & Transactions</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-muted text-foreground font-medium rounded-md hover:bg-muted/80 transition-colors">
            Edit Deal
          </button>
          <Link
            href={`/workflows/offer-draft?dealId=${deal.id}`}
            className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
          >
            New Offer
          </Link>
          <button className="px-4 py-2 bg-secondary text-secondary-foreground font-medium rounded-md hover:bg-secondary/90 transition-colors">
            Schedule Showing
          </button>
        </div>
      </div>

      <div className="flex border-b border-border overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={`?tab=${tab.id}`}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-background border border-border rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Deal Overview</h2>
            <div className="space-y-4">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Value
                </span>
                <p className="text-2xl font-bold mt-1 text-primary">
                  {deal.value
                    ? new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 0,
                      }).format(deal.value)
                    : '--'}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Stage
                </span>
                <p className="font-medium mt-1">{deal.stage.replace('_', ' ')}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Client
                </span>
                <p className="font-medium mt-1">
                  {deal.contact.firstName} {deal.contact.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{deal.contact.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-background border border-border rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Active Workflows</h2>
            <div className="space-y-3">
              {activeWorkflows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active drafts found.</p>
              ) : (
                activeWorkflows.map((wf) => (
                  <Link
                    key={wf.id}
                    href={`/workflows/${wf.type === 'OFFER_DRAFT' ? 'offer-draft' : 'listing-entry'}?sessionId=${wf.id}`}
                    className="block p-3 border border-primary/20 bg-primary/5 rounded-lg hover:border-primary/40 transition-colors"
                  >
                    <div className="font-medium text-sm text-primary">
                      {wf.type.replace('_', ' ')}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      Last saved {new Date(wf.updatedAt).toLocaleString()}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          {activeTab === 'overview' && (
            <div className="bg-background border border-border rounded-xl shadow-sm p-6 min-h-[400px]">
              <h2 className="text-lg font-bold mb-4">Activity Timeline</h2>
              <div className="space-y-6 mb-8">
                {deal.Activity.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No activities recorded yet.
                  </div>
                ) : (
                  deal.Activity.map((activity) => (
                    <div key={activity.id} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <span className="text-sm">
                          {activity.type === 'NOTE' ? '📝' : 
                           activity.type === 'CALL' ? '📞' : 
                           activity.type === 'EMAIL' ? '✉️' : 
                           activity.type === 'SMS' ? '📱' : 
                           activity.type === 'VIDEO' ? '🎥' : 
                           activity.type === 'SHOWING' ? '🏠' : '⚡'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {activity.type === 'NOTE' ? 'Note Added' : 
                           activity.type === 'SHOWING' ? 'Showing Scheduled' : 'Activity Logged'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                          {activity.content}
                        </p>
                        <span className="text-xs text-muted-foreground mt-2 block">
                          {new Date(activity.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {isAtLeastRole(userRole, AppRole.REALTOR_AGENT) && (
                <div className="pt-6 border-t border-border">
                  <AddActivityForm
                    addActivityAction={addActivity}
                    workspaceId={deal.workspaceId}
                    entityType="dealId"
                    entityId={deal.id}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'showings' && (
            <div className="bg-background border border-border rounded-xl shadow-sm p-6 min-h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold">MLS Showings & Offers</h2>
                <div className="flex gap-2">
                   <button className="px-3 py-1.5 bg-primary/10 text-primary font-bold text-xs rounded hover:bg-primary/20">+ Schedule Showing</button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-8">Manage property showings and formal offers connected to this deal.</p>
              
              <div className="space-y-4">
                <div className="border border-dashed border-border rounded-xl p-8 text-center bg-muted/5">
                  <span className="text-4xl mb-4 block">🏠</span>
                  <p className="text-sm font-bold text-foreground">No Showings Scheduled</p>
                  <p className="text-xs text-muted-foreground mt-2">Connect to MLS to pull showing availability.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="bg-background border border-border rounded-xl shadow-sm p-6 min-h-[400px]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Tasks & Follow-ups</h2>
                <button className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold rounded-md transition-colors">
                  + Add Task
                </button>
              </div>

              <div className="space-y-4">
                {deal.tasks && deal.tasks.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-border rounded-xl">
                     <p className="text-sm text-muted-foreground">No tasks assigned for this deal.</p>
                  </div>
                ) : (
                  deal.tasks && deal.tasks.map(task => (
                    <div key={task.id} className="p-4 border border-border rounded-xl flex items-center gap-4">
                      <input type="checkbox" className="w-5 h-5 rounded border-border" checked={task.status === 'DONE'} readOnly />
                      <div className="flex-1">
                        <h3 className={`font-bold text-sm ${task.status === 'DONE' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                      </div>
                      {task.dueDate && (
                        <div className="text-xs font-medium px-2 py-1 bg-muted rounded border border-border">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
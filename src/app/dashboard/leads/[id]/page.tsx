import { getServerSession } from 'next-auth/next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import AddActivityForm from '@/components/AddActivityForm';
import { authOptions } from '@/lib/auth';
import { createActivityAction as addActivity } from '@/lib/actions/activity';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { AppRole, isAtLeastRole } from '@/lib/permissions';
import { LeadIntelligence } from '@/components/LeadIntelligence';
import CommunicationsHub from '@/components/CommunicationsHub';
import ShowingForm from '@/components/ShowingForm';
import LeadStatusSelector from '@/components/LeadStatusSelector';
import LeadTagsEditor from '@/components/LeadTagsEditor';
import SearchAlertsWidget from '@/components/SearchAlertsWidget';
import LeadAutomationsWidget from '@/components/LeadAutomationsWidget';
import LeadQuickActions from '@/components/LeadQuickActions';
import DealStageTracker from '@/components/DealStageTracker';
import LeadContactInfoCard from '@/components/LeadContactInfoCard';

export default async function LeadDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const resolvedParams = await props.params;
  const searchParams = await props.searchParams;
  const activeTab = searchParams?.tab || 'profile';

  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);
  const userRole = access.workspaceRole;

  const lead = await prisma.lead.findFirst({
    where: { id: resolvedParams.id, workspaceId: access.workspaceId },
    include: {
      contact: {
        include: { deals: true }
      },
      tasks: true,
      workspace: true,
      searchAlerts: true,
      Activity: {
        orderBy: { createdAt: 'desc' },
      },
      WorkflowSession: {
        orderBy: { updatedAt: 'desc' },
      },
    },
  });

  if (!lead) {
    notFound();
  }

  const campaigns = await prisma.smartPlan.findMany({
    where: { workspaceId: access.workspaceId, isActive: true },
    select: { id: true, name: true, description: true, steps: true },
  });

  const siblingLeads = await prisma.lead.findMany({
    where: { workspaceId: access.workspaceId },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
  });

  const leadIndex = siblingLeads.findIndex((s) => s.id === lead.id);
  const prevLeadId = leadIndex > 0 ? siblingLeads[leadIndex - 1].id : null;
  const nextLeadId = leadIndex < siblingLeads.length - 1 ? siblingLeads[leadIndex + 1].id : null;

  const allSegments = await prisma.segment.findMany({
    where: { workspaceId: access.workspaceId },
    select: { id: true, name: true },
  });

  const workspaces = await prisma.workspace.findMany({
    where: {
      members: {
        some: { userId: access.userId },
      },
    },
  });

  const users = await prisma.user.findMany({
    where: {
      workspaces: {
        some: { workspaceId: access.workspaceId },
      },
    },
    select: { id: true, name: true },
  });

  const tabs = [
    { id: 'profile', label: 'Profile & Activity' },
    { id: 'communications', label: 'Communications' },
    { id: 'deals', label: 'Deals & Showings' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'intelligence', label: 'Intelligence (Scrapers)' },
    { id: 'workflows', label: 'Automations' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/leads"
            className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1"
          >
            &larr; Back to Leads
          </Link>
          <div className="h-4 w-[1px] bg-border hidden sm:block"></div>
          <div className="flex items-center gap-2">
            {prevLeadId && (
              <Link
                href={`/dashboard/leads/${prevLeadId}`}
                className="px-2 py-1 bg-muted hover:bg-muted/80 border border-border rounded text-[10px] font-bold uppercase transition-colors"
              >
                &larr; Prev
              </Link>
            )}
            <span className="text-[10px] text-muted-foreground font-semibold">
              {leadIndex + 1} of {siblingLeads.length} Leads
            </span>
            {nextLeadId && (
              <Link
                href={`/dashboard/leads/${nextLeadId}`}
                className="px-2 py-1 bg-muted hover:bg-muted/80 border border-border rounded text-[10px] font-bold uppercase transition-colors"
              >
                Next &rarr;
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
           <span className="px-2 py-0.5 bg-secondary/10 text-secondary-foreground text-[10px] font-bold rounded border border-secondary/20 uppercase tracking-tighter">
            {userRole.replace('_', ' ')}
          </span>
          {lead.isAiAssisted && (
             <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded border border-primary/20 uppercase tracking-tighter">
              AI ASSISTED
            </span>
          )}
        </div>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-4 bg-muted/10 border border-border rounded-2xl">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {lead.contact.firstName} {lead.contact.lastName}
            </h1>
            <LeadQuickActions
              leadId={lead.id}
              leadName={`${lead.contact.firstName} ${lead.contact.lastName || ''}`.trim()}
              segments={allSegments}
              workspaces={workspaces}
              users={users}
            />
          </div>
          <p className="text-muted-foreground italic text-sm mt-1">Lead ID: {lead.id}</p>
        </div>
        <div className="flex-1 max-w-xl">
          <DealStageTracker leadId={lead.id} />
        </div>
      </div>

      {/* Tabs */}
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
        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-6">
          {activeTab === 'profile' && (
             <div className="bg-background border border-border rounded-xl shadow-sm p-6 min-h-[400px]">
              <h2 className="text-lg font-bold mb-4">Activity Timeline</h2>
              <div className="space-y-6 mb-8">
                {lead.Activity.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No activities recorded yet.
                  </div>
                ) : (
                  lead.Activity.map((activity) => (
                    <div key={activity.id} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <span className="text-sm">
                          {activity.type === 'NOTE' ? '📝' : 
                           activity.type === 'CALL' ? '📞' : 
                           activity.type === 'EMAIL' ? '✉️' : 
                           activity.type === 'SMS' ? '📱' : 
                           activity.type === 'VIDEO' ? '🎥' : '⚡'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {activity.type === 'NOTE' ? 'Internal Note' : 
                           activity.type === 'CALL' ? 'Phone Call Logged' : 
                           activity.type === 'EMAIL' ? 'Email Sent' : 
                           activity.type === 'SMS' ? 'SMS Sent' : 
                           activity.type === 'VIDEO' ? 'Video Chat' : 'Activity Logged'}
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
                   <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-muted-foreground">Log New Interaction</h3>
                   <AddActivityForm
                    addActivityAction={addActivity}
                    workspaceId={lead.workspaceId}
                    entityType="leadId"
                    entityId={lead.id}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'communications' && (
            <CommunicationsHub leadId={lead.id} phone={lead.contact.phone} email={lead.contact.email} />
          )}

          {activeTab === 'deals' && (
            <div className="bg-background border border-border rounded-xl shadow-sm p-6 min-h-[400px]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Deals, Offers & Showings</h2>
              </div>
              
              <div className="space-y-4 mb-8">
                {lead.contact.deals.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-border rounded-xl">
                     <p className="text-sm text-muted-foreground">No active deals or showings for this lead.</p>
                  </div>
                ) : (
                  lead.contact.deals.map(deal => (
                    <div key={deal.id} className="p-4 border border-border rounded-xl flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm">{deal.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">Stage: {deal.stage} • Value: ${deal.value?.toLocaleString() || 'N/A'}</p>
                      </div>
                      <Link href={`/dashboard/deals/${deal.id}`} className="px-3 py-1 bg-muted border border-border rounded text-xs font-bold hover:bg-muted/80">
                        View Deal
                      </Link>
                    </div>
                  ))
                )}
              </div>

              <ShowingForm leadId={lead.id} />

              <div className="mt-8 pt-8 border-t border-border">
                 <SearchAlertsWidget leadId={lead.id} alerts={lead.searchAlerts} />
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
                {lead.tasks && lead.tasks.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-border rounded-xl">
                     <p className="text-sm text-muted-foreground">No tasks assigned for this lead.</p>
                  </div>
                ) : (
                  lead.tasks && lead.tasks.map(task => (
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

          {activeTab === 'intelligence' && (
            <div className="bg-background border border-border rounded-xl shadow-sm p-6 min-h-[400px]">
               <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold">Lead Intelligence</h2>
                    <p className="text-sm text-muted-foreground">AI-powered enrichment from public and social sources.</p>
                  </div>
               </div>
               <LeadIntelligence leadId={lead.id} initialData={lead.socialProfiles} />
            </div>
          )}

          {activeTab === 'workflows' && (
            <div className="bg-background border border-border rounded-xl shadow-sm p-6 min-h-[400px]">
               <h2 className="text-lg font-bold mb-4">Connected Workflows</h2>
               <div className="space-y-4">
                  {lead.WorkflowSession.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-border rounded-xl">
                       <p className="text-sm text-muted-foreground">No workflows currently attached to this lead.</p>
                       <div className="mt-6 flex flex-wrap gap-2 justify-center">
                          <Link href={`/workflows/offer-draft?leadId=${lead.id}`} className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold rounded-md transition-colors">
                            + Offer Draft
                          </Link>
                          <Link href={`/workflows/listing-entry?leadId=${lead.id}`} className="px-3 py-1.5 bg-secondary/10 text-secondary hover:bg-secondary/20 text-xs font-bold rounded-md transition-colors">
                            + Listing Entry
                          </Link>
                          <Link href={`/workflows/foreclosure-intake?leadId=${lead.id}`} className="px-3 py-1.5 bg-muted text-foreground hover:bg-muted/80 text-xs font-bold rounded-md transition-colors">
                            + Foreclosure Intake
                          </Link>
                       </div>
                    </div>
                  ) : (
                    lead.WorkflowSession.map((wf) => (
                       <Link 
                        key={wf.id} 
                        href={`/workflows/${wf.type.toLowerCase().replace('_', '-')}?sessionId=${wf.id}`}
                        className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/5 transition-colors"
                      >
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                               📝
                            </div>
                            <div className="flex flex-col">
                               <span className="font-bold text-sm">{wf.type.replace('_', ' ')}</span>
                               <span className="text-xs text-muted-foreground">Last updated {new Date(wf.updatedAt).toLocaleDateString()}</span>
                            </div>
                         </div>
                         <span className="px-2 py-1 bg-muted border border-border rounded text-[10px] font-bold uppercase tracking-tight">
                            {wf.status}
                         </span>
                       </Link>
                    ))
                  )}
               </div>

                <div className="mt-8 pt-8 border-t border-border">
                   <LeadAutomationsWidget leadId={lead.id} activePlanId={lead.smartPlanId} campaigns={campaigns} />
                </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-background border border-border rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Status & Goal</h2>
              <span className="px-2 py-0.5 bg-muted text-foreground text-[10px] font-bold uppercase rounded border border-border">
                 {lead.type || 'BUYER'}
              </span>
            </div>
            <div className="space-y-4">
              <div>
                 <label className="text-[10px] text-muted-foreground uppercase font-bold">Lead Status</label>
                 <div className="mt-1">
                   <LeadStatusSelector leadId={lead.id} initialStatus={lead.status} />
                 </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Engagement Score</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${lead.score && lead.score > 80 ? 'bg-primary' : 'bg-primary/50'}`}
                      style={{ width: `${lead.score || 0}%` }}
                    ></div>
                  </div>
                  <span
                    className={`text-sm font-bold ${lead.score && lead.score > 80 ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {lead.score}
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <LeadTagsEditor leadId={lead.id} initialTags={lead.tags} />
              </div>
            </div>
          </div>

          <LeadContactInfoCard leadId={lead.id} contact={lead.contact} source={lead.source} />

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
             <h2 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                ✨ Gemini CRM Assistant
             </h2>
             <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                &quot;This lead has high engagement with the <strong>Offer Draft</strong> workflow but hasn&apos;t responded to the last text. I recommend a personalized follow-up call regarding the 123 Elm St property.&quot;
             </p>
             <button className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors">
                Draft Follow-up Email
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

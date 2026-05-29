import { getServerSession } from 'next-auth/next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import AddActivityForm from '@/components/AddActivityForm';
import { authOptions } from '@/lib/auth';
import { createActivityAction as addActivity } from '@/lib/actions/activity';
import { requireWorkspaceAccess } from '@/lib/workspace-access';

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);
  const deal = await prisma.deal.findFirst({
    where: { id: resolvedParams.id, workspaceId: access.workspaceId },
    include: {
      contact: true,
      workspace: true,
      Activity: {
        orderBy: { createdAt: 'desc' },
      },
      WorkflowSession: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!deal) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          href="/deals"
          className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1"
        >
          &larr; Back to Deals
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{deal.title}</h1>
          <p className="text-muted-foreground">Deal Profile</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-muted text-foreground font-medium rounded-md hover:bg-muted/80 transition-colors">
            Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-background border border-border rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Deal Info</h2>
            <div className="space-y-4">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Stage
                </span>
                <p className="font-medium mt-1">{deal.stage}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Value
                </span>
                <p className="font-medium mt-1">
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
                  Contact
                </span>
                <p className="font-medium mt-1">
                  {deal.contact.firstName} {deal.contact.lastName}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-background border border-border rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Workflows</h2>
            <div className="space-y-4">
              <Link
                href={`/workflows/offer-draft`}
                className="block w-full text-center px-4 py-2 bg-muted text-foreground text-sm font-medium rounded-md hover:bg-muted/80 transition-colors"
              >
                + New Offer Draft
              </Link>
              <Link
                href={`/workflows/listing-entry`}
                className="block w-full text-center px-4 py-2 bg-muted text-foreground text-sm font-medium rounded-md hover:bg-muted/80 transition-colors"
              >
                + New Listing Entry
              </Link>

              <div className="mt-6 space-y-3 pt-4 border-t border-border">
                {deal.WorkflowSession.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center">No active workflows</p>
                ) : (
                  deal.WorkflowSession.map((wf) => (
                    <Link
                      href={`/workflows/${wf.type === 'OFFER_DRAFT' ? 'offer-draft' : 'listing-entry'}?sessionId=${wf.id}`}
                      key={wf.id}
                      className="block p-3 rounded-lg border border-border hover:border-primary/50 transition-colors group"
                    >
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">
                          {wf.type === 'OFFER_DRAFT' ? 'Offer Draft' : 'Listing Entry'}
                        </p>
                        <span
                          className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${wf.status === 'SUBMITTED' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}
                        >
                          {wf.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Updated {new Date(wf.updatedAt).toLocaleDateString()}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-background border border-border rounded-xl shadow-sm p-6 min-h-[400px]">
            <h2 className="text-lg font-bold mb-4">Activity Timeline</h2>
            <div className="space-y-6">
              {deal.Activity.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No activities recorded yet.
                </div>
              ) : (
                deal.Activity.map((activity) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <span className="text-sm">{activity.type === 'NOTE' ? '📝' : '⚡'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {activity.type === 'NOTE' ? 'Note Added' : 'Activity Logged'}
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

            <AddActivityForm
              addActivityAction={addActivity}
              workspaceId={deal.workspaceId}
              entityType="dealId"
              entityId={deal.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

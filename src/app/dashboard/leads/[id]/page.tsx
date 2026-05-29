import { getServerSession } from 'next-auth/next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import AddActivityForm from '@/components/AddActivityForm';
import { authOptions } from '@/lib/auth';
import { createActivityAction as addActivity } from '@/lib/actions/activity';
import { requireWorkspaceAccess } from '@/lib/workspace-access';

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);
  const lead = await prisma.lead.findFirst({
    where: { id: resolvedParams.id, workspaceId: access.workspaceId },
    include: {
      contact: true,
      workspace: true,
      Activity: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!lead) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          href="/leads"
          className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1"
        >
          &larr; Back to Leads
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {lead.contact.firstName} {lead.contact.lastName}
          </h1>
          <p className="text-muted-foreground">Lead Profile</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-muted text-foreground font-medium rounded-md hover:bg-muted/80 transition-colors">
            Edit
          </button>
          <button className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors">
            Convert to Deal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Contact Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-background border border-border rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Contact Info</h2>
            <div className="space-y-4">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Email
                </span>
                <p className="font-medium mt-1">{lead.contact.email || 'No email provided'}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Phone
                </span>
                <p className="font-medium mt-1">{lead.contact.phone || 'No phone provided'}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Source
                </span>
                <p className="font-medium mt-1 capitalize">{lead.source}</p>
              </div>
            </div>
          </div>

          <div className="bg-background border border-border rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Lead Status</h2>
            <div className="space-y-4">
              <div>
                <span
                  className={`px-3 py-1 text-sm rounded-full font-medium border ${
                    lead.status === 'NEW'
                      ? 'bg-secondary/20 text-secondary-foreground border-secondary/30'
                      : lead.status === 'QUALIFIED'
                        ? 'bg-primary/20 text-primary border-primary/30'
                        : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {lead.status}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Score
                </span>
                <div className="flex items-center gap-2 mt-2">
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
            </div>
          </div>
        </div>

        {/* Right Column: Timeline / Activity */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-background border border-border rounded-xl shadow-sm p-6 min-h-[400px]">
            <h2 className="text-lg font-bold mb-4">Activity Timeline</h2>
            <div className="space-y-6">
              {lead.Activity.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No activities recorded yet.
                </div>
              ) : (
                lead.Activity.map((activity) => (
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
              workspaceId={lead.workspaceId}
              entityType="leadId"
              entityId={lead.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

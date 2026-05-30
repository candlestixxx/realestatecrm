import { getServerSession } from 'next-auth/next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import AddActivityForm from '@/components/AddActivityForm';
import { authOptions } from '@/lib/auth';
import { createActivityAction as addActivity } from '@/lib/actions/activity';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { AppRole, isAtLeastRole } from '@/lib/permissions';

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);
  const userRole = access.workspaceRole;

  const contact = await prisma.contact.findFirst({
    where: { id: resolvedParams.id, workspaceId: access.workspaceId },
    include: {
      Activity: {
        orderBy: { createdAt: 'desc' },
      },
      deals: true,
      leads: true,
    },
  });

  if (!contact) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/contacts"
          className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1"
        >
          &larr; Back to Contacts
        </Link>
        <span className="px-2 py-0.5 bg-secondary/10 text-secondary-foreground text-[10px] font-bold rounded border border-secondary/20 uppercase tracking-tighter">
          {userRole.replace('_', ' ')}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {contact.firstName} {contact.lastName}
          </h1>
          <p className="text-muted-foreground">Contact Profile</p>
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
            <h2 className="text-lg font-bold mb-4">Details</h2>
            <div className="space-y-4">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Email
                </span>
                <p className="font-medium mt-1">{contact.email || 'No email provided'}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Phone
                </span>
                <p className="font-medium mt-1">{contact.phone || 'No phone provided'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-background border border-border rounded-xl shadow-sm p-6 min-h-[400px]">
            <h2 className="text-lg font-bold mb-4">Activity Timeline</h2>
            <div className="space-y-6">
              {contact.Activity.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No activities recorded yet.
                </div>
              ) : (
                contact.Activity.map((activity) => (
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

            {isAtLeastRole(userRole, AppRole.REALTOR_AGENT) && (
              <AddActivityForm
                addActivityAction={addActivity}
                workspaceId={contact.workspaceId}
                entityType="contactId"
                entityId={contact.id}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

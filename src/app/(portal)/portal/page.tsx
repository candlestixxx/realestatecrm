import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import PortalListings from '@/components/portal/PortalListings';

export default async function PortalHome() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  // Attempt to find the client based on their email.
  const contact = await prisma.contact.findFirst({
    where: { email: session.user.email },
    include: {
      deals: {
        include: {
          WorkflowSession: {
            orderBy: { updatedAt: 'desc' },
          },
        },
      },
    },
  });

  if (!contact) {
    return (
      <div className="space-y-8 flex items-center justify-center min-h-[50vh]">
        <div className="bg-muted/10 border border-border rounded-xl p-8 text-center space-y-4 max-w-lg">
          <h1 className="text-3xl font-bold">Welcome, {session.user.name || session.user.email}</h1>
          <p className="text-muted-foreground">
            We couldn&apos;t find any active files linked to your email address. Please contact your
            agent to ensure your email matches their records.
          </p>
        </div>
      </div>
    );
  }

  const activeDeals = contact.deals.filter((d) => d.stage !== 'CLOSED_WON');

  // Flatten out all active workflows across all deals
  const activeWorkflows = activeDeals.flatMap((d) =>
    d.WorkflowSession.filter((w) => w.status !== 'APPROVED'),
  );

  return (
    <div className="space-y-8">
      <div className="bg-muted/10 border border-border rounded-xl p-8 text-center space-y-4">
        <h1 className="text-3xl font-bold">Welcome back, {contact.firstName}</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Here you can securely view the progress of your transactions, review drafted offers, and
          securely sign documents.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-background border border-border rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-bold">Your Active Deals</h2>
          <div className="space-y-3">
            {activeDeals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active deals found.</p>
            ) : (
              activeDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="p-4 border border-border rounded-lg bg-muted/5 flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-semibold">{deal.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Status: {deal.stage.replace('_', ' ')}
                    </p>
                  </div>
                  <span className="font-bold">
                    {deal.value
                      ? new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          maximumFractionDigits: 0,
                        }).format(deal.value)
                      : '--'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-background border border-border rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-bold">Action Items</h2>
          <div className="space-y-3">
            {activeWorkflows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No action items pending.</p>
            ) : (
              activeWorkflows.map((wf) => (
                <div
                  key={wf.id}
                  className="p-4 border border-primary/30 bg-primary/5 rounded-lg flex flex-col gap-3"
                >
                  <div>
                    <h3 className="font-semibold text-primary">
                      Review {wf.type.replace('_', ' ')}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your agent has prepared a document. Please review.
                    </p>
                  </div>
                  <Link
                    href={`/workflows/${wf.type === 'OFFER_DRAFT' ? 'offer-draft' : 'listing-entry'}?sessionId=${wf.id}`}
                    className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors text-center"
                  >
                    Review Document
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Available Listings */}
      <div className="bg-background border border-border rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-bold">Available Listings</h2>
        <p className="text-sm text-muted-foreground">Browse properties matched to your criteria.</p>
        <div id="portal-listings" className="grid md:grid-cols-2 gap-4">
          <PortalListings />
        </div>
      </div>
    </div>
  );
}

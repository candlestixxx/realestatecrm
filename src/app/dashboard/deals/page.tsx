import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import AddDealModal from '@/components/AddDealModal';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { dealSchema } from '@/lib/validations/deal';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { syncDealToVectorStore } from '@/lib/rag';

async function addDeal(formData: FormData) {
  'use server';

  const rawData = {
    title: formData.get('title'),
    value: formData.get('value'),
    stage: formData.get('stage'),
    workspaceId: formData.get('workspaceId'),
    contactId: formData.get('contactId'),
  };

  const validatedData = dealSchema.safeParse(rawData);

  if (!validatedData.success) {
    return { error: validatedData.error.issues[0].message };
  }

  const { title, value, stage, workspaceId, contactId } = validatedData.data;

  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (workspaceId !== access.workspaceId) {
    return { error: 'Workspace access denied.' };
  }

  try {
    const deal = await prisma.deal.create({
      data: {
        title,
        value: value ? Number(value) : null,
        stage,
        workspaceId,
        contactId,
      },
    });

    const contact = contactId
      ? await prisma.contact.findUnique({
          where: { id: contactId },
          select: { firstName: true, lastName: true, email: true },
        })
      : null;

    await syncDealToVectorStore(deal, contact);
  } catch (error) {
    console.error('Failed to add deal:', error);
    return { error: 'An unexpected error occurred while saving.' };
  }
}

export default async function DealsPage() {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);
  const workspaceId = access.workspaceId;

  const deals = await prisma.deal.findMany({
    where: { workspaceId },
    include: {
      contact: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const workspaces = await prisma.workspace.findMany();
  const contacts = await prisma.contact.findMany({
    where: { workspaceId },
    orderBy: { firstName: 'asc' },
  });

  const stages = [
    { id: 'PROSPECTING', label: 'Prospecting' },
    { id: 'QUALIFICATION', label: 'Qualification' },
    { id: 'PROPOSAL', label: 'Proposal/Showing' },
    { id: 'NEGOTIATION', label: 'Negotiation' },
    { id: 'UNDER_CONTRACT', label: 'Under Contract' },
    { id: 'CLOSED_WON', label: 'Closed Won' },
  ];

  return (
    <div className="space-y-6 h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deals Pipeline</h1>
          <p className="text-muted-foreground">Track and manage your active transactions.</p>
        </div>
        <div className="flex gap-2">
          <AddDealModal addDealAction={addDeal} workspaces={workspaces} contacts={contacts} />
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 h-full min-w-max">
          {stages.map((stage) => {
            const stageDeals = deals.filter((d) => d.stage === stage.id);
            const stageTotal = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);

            return (
              <div
                key={stage.id}
                className="w-80 flex flex-col bg-muted/10 border border-border rounded-xl"
              >
                <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20 rounded-t-xl">
                  <h3 className="font-semibold">{stage.label}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium bg-background px-2 py-1 rounded-full border border-border">
                      {stageDeals.length}
                    </span>
                  </div>
                </div>

                <div className="p-2 flex-1 overflow-y-auto space-y-2">
                  {stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="bg-background border border-border p-3 rounded-lg shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Link
                          href={`/deals/${deal.id}`}
                          className="font-medium text-sm group-hover:text-primary transition-colors"
                        >
                          {deal.title}
                        </Link>
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">
                        {deal.contact.firstName} {deal.contact.lastName}
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-foreground">
                          {deal.value
                            ? new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                maximumFractionDigits: 0,
                              }).format(deal.value)
                            : '--'}
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(deal.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}

                  {stageDeals.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                      No deals
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-border text-xs text-muted-foreground flex justify-between bg-muted/5 rounded-b-xl">
                  <span>Total Value:</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      maximumFractionDigits: 0,
                    }).format(stageTotal)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

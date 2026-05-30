import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import type { Prisma } from '@prisma/client';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { leadSchema } from '@/lib/validations/lead';
import { resolveWorkspaceAccess } from '@/lib/workspace-access';
import { syncContactToVectorStore, syncLeadToVectorStore } from '@/lib/rag';
import { AppRole, isAtLeastRole } from '@/lib/permissions';
import { DEFAULT_WORKSPACE_SLUG } from '@/lib/workspace-context';
import AddLeadModal from '@/components/AddLeadModal';

async function addLead(formData: FormData) {
  'use server';

  const session = await getServerSession(authOptions);
  const access = (await resolveWorkspaceAccess(session)) ?? {
    userId: session?.user?.id ?? 'demo-user',
    workspaceId: DEFAULT_WORKSPACE_SLUG,
    workspaceSlug: DEFAULT_WORKSPACE_SLUG,
    workspaceRole: session?.user?.role ?? 'REALTOR_AGENT',
    isDemo: true,
  };

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions to add leads.' };
  }

  const rawData = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    workspaceId: access.workspaceId,
  };

  const validatedData = leadSchema.safeParse(rawData);
  if (!validatedData.success) {
    return { error: validatedData.error.issues[0].message };
  }

  const { firstName, lastName, email } = validatedData.data;

  try {
    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName: lastName || null,
        email: email || null,
        workspaceId: access.workspaceId,
      },
    });

    const lead = await prisma.lead.create({
      data: {
        status: 'NEW',
        score: 50,
        source: 'Manual',
        workspaceId: access.workspaceId,
        contactId: contact.id,
      },
    });

    await Promise.all([syncContactToVectorStore(contact), syncLeadToVectorStore(lead, contact)]);
    return { success: true };
  } catch (error) {
    console.error('Failed to add lead:', error);
    return { error: 'An unexpected error occurred while saving.' };
  }
}

export default async function LeadsPage(props: {
  searchParams?: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const query = searchParams?.q || '';
  const statusFilter = searchParams?.status || 'ALL';
  const currentPage = Math.max(1, Number(searchParams?.page) || 1);
  const pageSize = 10;

  const session = await getServerSession(authOptions);
  const access = (await resolveWorkspaceAccess(session)) ?? {
    userId: session?.user?.id ?? 'demo-user',
    workspaceId: DEFAULT_WORKSPACE_SLUG,
    workspaceSlug: DEFAULT_WORKSPACE_SLUG,
    workspaceRole: session?.user?.role ?? 'REALTOR_AGENT',
    isDemo: true,
  };

  const workspaceId = access.workspaceId || DEFAULT_WORKSPACE_SLUG;
  const whereClause: Prisma.LeadWhereInput = { workspaceId };

  if (query) {
    whereClause.OR = [
      { contact: { firstName: { contains: query } } },
      { contact: { lastName: { contains: query } } },
      { contact: { email: { contains: query } } },
    ];
  }

  if (statusFilter && statusFilter !== 'ALL') {
    whereClause.status = statusFilter;
  }

  let leads: any[] = [];
  let totalCount = 0;
  let loadError: string | null = null;

  try {
    const [leadRows, leadTotal] = await Promise.all([
      prisma.lead.findMany({
        where: whereClause,
        include: { contact: true },
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: (currentPage - 1) * pageSize,
      }),
      prisma.lead.count({ where: whereClause }),
    ]);

    leads = leadRows as any[];
    totalCount = leadTotal;
  } catch (error) {
    console.error('Leads page load failed:', error);
    loadError = 'The leads list could not load from the database. Showing a safe fallback view.';
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const workspaces = await prisma.workspace.findMany({
    where: {
      members: {
        some: { userId: access.userId },
      },
    },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">Manage your incoming leads and prospects.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-muted text-foreground font-medium rounded-md hover:bg-muted/80 transition-colors">
            Import
          </button>
          <AddLeadModal addLeadAction={addLead} workspaces={workspaces} />
        </div>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
          {loadError}
        </div>
      ) : null}

      <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden">
        <form className="p-4 border-b border-border flex gap-4 items-center bg-muted/20">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search leads..."
            className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <select
            name="status"
            defaultValue={statusFilter}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >

            <option value="ALL">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="QUALIFIED">QUALIFIED</option>
          </select>
          <input type="hidden" name="page" value={currentPage} />
          <button
            type="submit"
            className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-md hover:bg-secondary/90 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Contact</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Score</th>
                <th className="px-6 py-3 font-medium">Source</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4 font-medium">
                    {lead.contact?.firstName} {lead.contact?.lastName}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span>{lead.contact?.email}</span>
                      <span className="text-xs text-muted-foreground">{lead.contact?.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium border ${
                        lead.status === 'NEW'
                          ? 'bg-secondary/20 text-secondary-foreground border-secondary/30'
                          : lead.status === 'QUALIFIED'
                            ? 'bg-primary/20 text-primary border-primary/30'
                            : 'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-muted rounded-full h-2 max-w-[60px]">
                        <div
                          className={`h-2 rounded-full ${lead.score && lead.score > 80 ? 'bg-primary' : 'bg-primary/50'}`}
                          style={{ width: `${lead.score || 0}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs font-bold ${lead.score && lead.score > 80 ? 'text-primary' : 'text-muted-foreground'}`}
                      >
                        {lead.score}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{lead.source}</td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/leads/${lead.id}`}
                      className="text-primary hover:underline text-sm font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No leads found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground bg-muted/10">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of{' '}
            {totalCount} entries
          </span>
          <div className="flex gap-2">
            <Link
              href={`/dashboard/leads?q=${query}&status=${statusFilter}&page=${currentPage - 1}`}
              className={`px-3 py-1 border border-border rounded hover:bg-muted transition-colors ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
            >
              Prev
            </Link>
            <Link
              href={`/dashboard/leads?q=${query}&status=${statusFilter}&page=${currentPage + 1}`}
              className={`px-3 py-1 border border-border rounded hover:bg-muted transition-colors ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
            >
              Next
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

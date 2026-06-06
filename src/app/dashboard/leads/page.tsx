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
import { seedSegmentsIfEmpty } from '@/lib/actions/segment';

import { LeadTableClient } from '@/components/LeadTableClient';

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
    phone: formData.get('phone'),
    address: formData.get('address'),
    notes: formData.get('notes'),
    type: formData.get('type') || 'BUYER',
    workspaceId: formData.get('workspaceId'),
    tags: formData.get('tags'),
  };

  const validatedData = leadSchema.safeParse(rawData);
  if (!validatedData.success) {
    return { error: validatedData.error.issues[0].message };
  }

  const { firstName, lastName, email, phone, address, notes, type, workspaceId, tags } = validatedData.data;

  try {
    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName: lastName || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        workspaceId: workspaceId,
      },
    });

    const lead = await prisma.lead.create({
      data: {
        status: 'NEW',
        score: 50,
        source: 'Manual',
        type: type,
        workspaceId: workspaceId,
        contactId: contact.id,
        tags: tags || null,
      },
    });

    if (notes) {
      await prisma.activity.create({
        data: {
          type: 'NOTE',
          content: notes,
          workspaceId,
          userId: access.userId,
          leadId: lead.id,
        },
      });
    }

    await Promise.all([syncContactToVectorStore(contact), syncLeadToVectorStore(lead, contact)]);
    return { success: true };
  } catch (error) {
    console.error('Failed to add lead:', error);
    return { error: 'An unexpected error occurred while saving.' };
  }
}

export default async function LeadsPage(props: {
  searchParams?: Promise<{ status?: string; q?: string; page?: string; limit?: string }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const query = searchParams?.q || '';
  const statusFilter = searchParams?.status || 'ALL';
  const currentPage = Math.max(1, Number(searchParams?.page) || 1);
  const pageSize = Math.max(10, Math.min(100, Number(searchParams?.limit) || 10));

  const session = await getServerSession(authOptions);
  const access = (await resolveWorkspaceAccess(session)) ?? {
    userId: session?.user?.id ?? 'demo-user',
    workspaceId: DEFAULT_WORKSPACE_SLUG,
    workspaceSlug: DEFAULT_WORKSPACE_SLUG,
    workspaceRole: session?.user?.role ?? 'REALTOR_AGENT',
    isDemo: true,
  };

  const workspaceId = access.workspaceId || DEFAULT_WORKSPACE_SLUG;

  // Auto-seed default segments if empty
  await seedSegmentsIfEmpty(workspaceId);

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

  let leads: Prisma.LeadGetPayload<{ include: { contact: true } }>[] = [];
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

    leads = leadRows;
    totalCount = leadTotal;
  } catch (error) {
    console.error('Leads page load failed:', error);
    loadError = 'The leads list could not load from the database. Showing a safe fallback view.';
  }

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
        some: { workspaceId },
      },
    },
    select: { id: true, name: true },
  });

  const segments = await prisma.segment.findMany({
    where: { workspaceId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
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
            <option value="PROSPECTING">PROSPECTING</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="QUALIFIED">QUALIFIED</option>
          </select>
          <input type="hidden" name="page" value={currentPage} />
          <input type="hidden" name="limit" value={pageSize} />
          <button
            type="submit"
            className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-md hover:bg-secondary/90 transition-colors"
          >
            Search
          </button>
        </form>

        <LeadTableClient
          initialLeads={leads}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          workspaces={workspaces}
          users={users}
          segments={segments}
        />
      </div>
    </div>
  );
}

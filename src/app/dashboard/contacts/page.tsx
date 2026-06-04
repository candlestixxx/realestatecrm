import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import AddContactModal from '@/components/AddContactModal';
import CreateSegmentModal from '@/components/CreateSegmentModal';
import { authOptions } from '@/lib/auth';
import { contactSchema } from '@/lib/validations/contact';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { syncContactToVectorStore } from '@/lib/rag';
import { AppRole, isAtLeastRole } from '@/lib/permissions';
import { ContactTableClient } from '@/components/ContactTableClient';
import { createWorkspaceAction } from '@/lib/actions/create-workspace';

async function addContact(formData: FormData) {
  'use server';

  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);
  const workspaceId = access.workspaceId;

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions to add contacts.' };
  }

  const rawData = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    notes: formData.get('notes'),
    workspaceId, // Override client value with session value
  };

  const validatedData = contactSchema.safeParse(rawData);

  if (!validatedData.success) {
    return { error: validatedData.error.issues[0].message };
  }

  const { firstName, lastName, email, phone, address, notes } = validatedData.data;

  try {
    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName: lastName || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        workspaceId,
      },
    });

    if (notes) {
      await prisma.activity.create({
        data: {
          type: 'NOTE',
          content: notes,
          workspaceId,
          userId: access.userId,
          contactId: contact.id,
        },
      });
    }

    await syncContactToVectorStore(contact);
  } catch (error) {
    console.error('Failed to add contact:', error);
    return { error: 'An unexpected error occurred while saving.' };
  }
}

export default async function ContactsPage(props: {
  searchParams?: Promise<{ q?: string; page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.q || '';
  const currentPage = Math.max(1, Number(searchParams?.page) || 1);
  const pageSize = 10;

  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);
  const workspaceId = access.workspaceId;
  
  const whereClause: Prisma.ContactWhereInput = { workspaceId };
  if (query) {
    whereClause.OR = [
      { firstName: { contains: query } },
      { lastName: { contains: query } },
      { email: { contains: query } },
      { phone: { contains: query } },
    ];
  }

  const [contacts, totalCount] = await Promise.all([
    prisma.contact.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip: (currentPage - 1) * pageSize,
    }),
    prisma.contact.count({ where: whereClause }),
  ]);

  const workspaces = await prisma.workspace.findMany({
    where: {
      members: {
        some: { userId: access.userId },
      },
    },
  });
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">Manage your client relationships and network.</p>
        </div>
        <div className="flex gap-2">
          <CreateSegmentModal createWorkspaceAction={createWorkspaceAction} />
          <AddContactModal addContactAction={addContact} workspaces={workspaces} />
        </div>
      </div>

      <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden">
        <form className="p-4 border-b border-border flex gap-4 items-center bg-muted/20">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search contacts..."
            className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input type="hidden" name="page" value={currentPage} />
          <button
            type="submit"
            className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-md hover:bg-secondary/90 transition-colors"
          >
            Search
          </button>
        </form>

        <ContactTableClient
          initialContacts={contacts}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          workspaces={workspaces}
        />
      </div>
    </div>
  );
}

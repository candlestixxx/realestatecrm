import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import AddContactModal from '@/components/AddContactModal';
import { authOptions } from '@/lib/auth';
import { contactSchema } from '@/lib/validations/contact';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { syncContactToVectorStore } from '@/lib/rag';
import Link from 'next/link';

async function addContact(formData: FormData) {
  'use server';

  const rawData = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    workspaceId: formData.get('workspaceId'),
  };

  const validatedData = contactSchema.safeParse(rawData);

  if (!validatedData.success) {
    return { error: validatedData.error.issues[0].message };
  }

  const { firstName, lastName, email, phone, workspaceId } = validatedData.data;

  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (workspaceId !== access.workspaceId) {
    return { error: 'Workspace access denied.' };
  }

  try {
    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName: lastName || null,
        email: email || null,
        phone: phone || null,
        workspaceId,
      },
    });

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

  const workspaces = await prisma.workspace.findMany();
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">Manage your client relationships and network.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-muted text-foreground font-medium rounded-md hover:bg-muted/80 transition-colors">
            Import
          </button>
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Phone</th>
                <th className="px-6 py-3 font-medium">Added</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4 font-medium">
                    <Link href={`/contacts/${contact.id}`} className="hover:underline">
                      {contact.firstName} {contact.lastName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{contact.email || '--'}</td>
                  <td className="px-6 py-4 text-muted-foreground">{contact.phone || '--'}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary hover:underline text-sm font-medium">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No contacts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground bg-muted/10">
          <span>
            Showing {totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries
          </span>
          <div className="flex gap-2">
            <Link
              href={`/contacts?q=${query}&page=${currentPage - 1}`}
              className={`px-3 py-1 border border-border rounded hover:bg-muted transition-colors ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
            >
              Prev
            </Link>
            <Link
              href={`/contacts?q=${query}&page=${currentPage + 1}`}
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

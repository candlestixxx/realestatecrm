import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getWorkspaceScope, DEFAULT_WORKSPACE_SLUG } from '@/lib/workspace-context';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { workspaceSlug: workspaceId, actorId } = getWorkspaceScope(session);

    // Enforce authentication context existence
    if (!actorId || !workspaceId || workspaceId === DEFAULT_WORKSPACE_SLUG) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchTerms = query.split(' ').filter(Boolean).map(term => term.trim());

    // Search Leads
    const leadsPromise = prisma.lead.findMany({
      where: {
        workspaceId,
        contact: {
          OR: searchTerms.map(term => ({
            OR: [
              { firstName: { contains: term } },
              { lastName: { contains: term } },
              { email: { contains: term } },
            ]
          }))
        }
      },
      take: 5,
      include: { contact: true },
    });


    // Search Contacts
    const contactsPromise = prisma.contact.findMany({
      where: {
        workspaceId,
        OR: searchTerms.map(term => ({
          OR: [
            { firstName: { contains: term } },
            { lastName: { contains: term } },
            { email: { contains: term } },
          ]
        }))
      },
      take: 5,
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    // Search Deals
    const dealsPromise = prisma.deal.findMany({
      where: {
        workspaceId,
        title: { contains: query },
      },
      take: 5,
      select: { id: true, title: true, stage: true },
    });

    // Search Tasks
    const tasksPromise = prisma.task.findMany({
      where: {
        workspaceId,
        title: { contains: query },
      },
      take: 5,
      select: { id: true, title: true, status: true },
    });

    const [leads, contacts, deals, tasks] = await Promise.all([
      leadsPromise,
      contactsPromise,
      dealsPromise,
      tasksPromise,
    ]);


    const results = [
      ...leads.map((l) => ({
        id: l.id,
        type: 'lead' as const,
        title: [l.contact?.firstName, l.contact?.lastName].filter(Boolean).join(' '),
        subtitle: l.contact?.email || 'No email',
        url: `/dashboard/leads/${l.id}`,
      })),

      ...contacts.map((c) => ({
        id: c.id,
        type: 'contact' as const,
        title: [c.firstName, c.lastName].filter(Boolean).join(' '),
        subtitle: c.email || '',
        url: `/dashboard/contacts/${c.id}`,
      })),
      ...deals.map((d) => ({
        id: d.id,
        type: 'deal' as const,
        title: d.title,
        subtitle: `Stage: ${d.stage}`,
        url: `/dashboard/deals/${d.id}`,
      })),
      ...tasks.map((t) => ({
        id: t.id,
        type: 'task' as const,
        title: t.title,
        subtitle: `Status: ${t.status}`,
        url: `/dashboard/tasks`,
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

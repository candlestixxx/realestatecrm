'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { AppRole, isAtLeastRole } from '@/lib/permissions';

export async function seedSegmentsIfEmpty(workspaceId: string) {
  const workspaceExists = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });
  if (!workspaceExists) {
    console.warn(`Workspace with ID ${workspaceId} does not exist. Skipping segment seeding.`);
    return;
  }

  const count = await prisma.segment.count({ where: { workspaceId } });
  if (count === 0) {
    await prisma.segment.createMany({
      data: [
        {
          name: 'Preforeclosure',
          description: 'Leads matching Macomb/Wayne County preforeclosure notices.',
          workspaceId,
          filters: JSON.stringify({ status: 'PREFORECLOSURE' }),
        },
        {
          name: 'Expireds',
          description: 'MLS listings that expired or were withdrawn.',
          workspaceId,
          filters: JSON.stringify({ status: 'EXPIRED' }),
        },
        {
          name: 'FSBO',
          description: 'For Sale By Owner properties and leads.',
          workspaceId,
          filters: JSON.stringify({ status: 'FSBO' }),
        },
        {
          name: 'Company Leads',
          description: 'General incoming company prospective buyer/seller leads.',
          workspaceId,
          filters: JSON.stringify({}),
        },
      ],
    });
  }
}

export async function createSegmentAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions.' };
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const filtersJson = formData.get('filters') as string || '{}';

  if (!name) {
    return { error: 'Segment name is required.' };
  }

  try {
    await prisma.segment.create({
      data: {
        name,
        description: description || null,
        filters: filtersJson,
        workspaceId: access.workspaceId,
      },
    });

    revalidatePath('/dashboard/segments');
    return { success: true };
  } catch (error) {
    console.error('Failed to create segment:', error);
    return { error: 'An unexpected error occurred while saving.' };
  }
}

export async function deleteSegmentAction(segmentId: string) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions.' };
  }

  try {
    await prisma.segment.delete({
      where: { id: segmentId, workspaceId: access.workspaceId },
    });

    revalidatePath('/dashboard/segments');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete segment:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function addLeadToSegmentAction(leadId: string, segmentId: string) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions.' };
  }

  try {
    await prisma.segment.update({
      where: { id: segmentId, workspaceId: access.workspaceId },
      data: {
        leads: {
          connect: { id: leadId },
        },
      },
    });

    revalidatePath(`/dashboard/leads/${leadId}`);
    revalidatePath('/dashboard/leads');
    revalidatePath('/dashboard/segments');
    return { success: true };
  } catch (error) {
    console.error('Failed to add lead to segment:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function removeLeadFromSegmentAction(leadId: string, segmentId: string) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions.' };
  }

  try {
    await prisma.segment.update({
      where: { id: segmentId, workspaceId: access.workspaceId },
      data: {
        leads: {
          disconnect: { id: leadId },
        },
      },
    });

    revalidatePath(`/dashboard/leads/${leadId}`);
    revalidatePath('/dashboard/leads');
    revalidatePath('/dashboard/segments');
    return { success: true };
  } catch (error) {
    console.error('Failed to remove lead from segment:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function addLeadsToSegmentBulkAction(leadIds: string[], segmentId: string) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions.' };
  }

  try {
    await prisma.segment.update({
      where: { id: segmentId, workspaceId: access.workspaceId },
      data: {
        leads: {
          connect: leadIds.map((id) => ({ id })),
        },
      },
    });

    revalidatePath('/dashboard/leads');
    revalidatePath('/dashboard/segments');
    return { success: true };
  } catch (error) {
    console.error('Failed bulk adding leads to segment:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { AppRole, isAtLeastRole } from '@/lib/permissions';

export async function updateLeadTagsAction(leadId: string, tags: string) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions to update tags.' };
  }

  try {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, workspaceId: access.workspaceId },
    });

    if (!lead) {
      return { error: 'Lead not found.' };
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: { tags: tags || null },
    });

    revalidatePath(`/dashboard/leads/${leadId}`);
    revalidatePath('/dashboard/leads');
    return { success: true };
  } catch (error) {
    console.error('Failed to update tags:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function updateLeadStatusAction(leadId: string, status: string) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions to update status.' };
  }

  try {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, workspaceId: access.workspaceId },
      include: { contact: true },
    });

    if (!lead) {
      return { error: 'Lead not found.' };
    }

    const oldStatus = lead.status;
    if (oldStatus === status) {
      return { success: true };
    }

    await prisma.$transaction([
      prisma.lead.update({
        where: { id: leadId },
        data: { status },
      }),
      prisma.activity.create({
        data: {
          type: 'SYSTEM',
          content: `Status changed from ${oldStatus} to ${status}.`,
          workspaceId: access.workspaceId,
          userId: access.userId,
          leadId: leadId,
        },
      }),
    ]);

    revalidatePath(`/dashboard/leads/${leadId}`);
    revalidatePath('/dashboard/leads');
    return { success: true };
  } catch (error) {
    console.error('Failed to update status:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

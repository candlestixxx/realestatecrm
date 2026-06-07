'use server';

import { getServerSession } from 'next-auth/next';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { syncActivityToVectorStore } from '@/lib/rag';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { activitySchema } from '@/lib/validations/activity';
import { AppRole, isAtLeastRole } from '@/lib/permissions';

export async function createActivityAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  // Enforcement: Office Manager or higher can log activities broadly
  // Standard Agents can log activities they have access to
  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions to log activity.' };
  }

  const rawData = {
    content: formData.get('content'),
    type: formData.get('type'),
    workspaceId: access.workspaceId, // derive from session
    leadId: formData.get('leadId'),
    dealId: formData.get('dealId'),
    contactId: formData.get('contactId'),
  };

  const validatedData = activitySchema.safeParse(rawData);

  if (!validatedData.success) {
    return { error: validatedData.error.issues[0].message };
  }

  const data = validatedData.data;

  if (data.workspaceId !== access.workspaceId) {
    return { error: 'Workspace access denied.' };
  }

  try {
    const activity = await prisma.activity.create({
      data: {
        content: data.content,
        type: data.type,
        workspaceId: data.workspaceId,
        leadId: data.leadId || null,
        dealId: data.dealId || null,
        contactId: data.contactId || null,
      },
    });

    const [lead, deal, contact] = await Promise.all([
      data.leadId
        ? prisma.lead.findFirst({
            where: { id: data.leadId, workspaceId: access.workspaceId },
            select: {
              id: true,
              source: true,
              status: true,
              score: true,
            },
          })
        : Promise.resolve(null),
      data.dealId
        ? prisma.deal.findFirst({
            where: { id: data.dealId, workspaceId: access.workspaceId },
            select: {
              id: true,
              title: true,
              stage: true,
              value: true,
            },
          })
        : Promise.resolve(null),
      data.contactId
        ? prisma.contact.findFirst({
            where: { id: data.contactId, workspaceId: access.workspaceId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          })
        : Promise.resolve(null),
    ]);

    // If any entity was requested but not found in this workspace, abort
    if ((data.leadId && !lead) || (data.dealId && !deal) || (data.contactId && !contact)) {
      return { error: 'Record not found in the active workspace.' };
    }

    await syncActivityToVectorStore({
      activity,
      lead,
      deal,
      contact,
    });

    const revalidateTargets = new Set<string>();
    if (data.leadId) revalidateTargets.add(`/dashboard/leads/${data.leadId}`);
    if (data.dealId) revalidateTargets.add(`/dashboard/deals/${data.dealId}`);
    if (data.contactId) revalidateTargets.add(`/dashboard/contacts/${data.contactId}`);

    for (const target of revalidateTargets) {
      revalidatePath(target);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to add activity:', error);
    return { error: 'An unexpected error occurred while saving.' };
  }
}

'use server';

import { getServerSession } from 'next-auth/next';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { syncActivityToVectorStore } from '@/lib/rag';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { activitySchema } from '@/lib/validations/activity';

export async function createActivityAction(formData: FormData) {
  const rawData = {
    content: formData.get('content'),
    type: formData.get('type'),
    workspaceId: formData.get('workspaceId'),
    leadId: formData.get('leadId'),
    dealId: formData.get('dealId'),
    contactId: formData.get('contactId'),
  };

  const validatedData = activitySchema.safeParse(rawData);

  if (!validatedData.success) {
    return { error: validatedData.error.issues[0].message };
  }

  const data = validatedData.data;
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

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
        ? prisma.lead.findUnique({
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
        ? prisma.deal.findUnique({
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
        ? prisma.contact.findUnique({
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

    await syncActivityToVectorStore({
      activity,
      lead,
      deal,
      contact,
    });

    const revalidateTargets = new Set<string>();
    if (data.leadId) revalidateTargets.add(`/leads/${data.leadId}`);
    if (data.dealId) revalidateTargets.add(`/deals/${data.dealId}`);
    if (data.contactId) revalidateTargets.add(`/contacts/${data.contactId}`);

    for (const target of revalidateTargets) {
      revalidatePath(target);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to add activity:', error);
    return { error: 'An unexpected error occurred while saving.' };
  }
}

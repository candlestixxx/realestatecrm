'use server';

import { getServerSession } from 'next-auth/next';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { syncActivityToVectorStore } from '@/lib/rag';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { activitySchema, activityActionSchema } from '@/lib/validations/activity';
import { AppRole, isAtLeastRole } from '@/lib/permissions';

export async function createActivityAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions to log activity.' };
  }

  const rawData = {
    content: formData.get('content'),
    formattedContent: formData.get('formattedContent') || null,
    type: formData.get('type'),
    workspaceId: access.workspaceId,
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
        formattedContent: data.formattedContent || null,
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
            select: { id: true, source: true, status: true, score: true },
          })
        : Promise.resolve(null),
      data.dealId
        ? prisma.deal.findFirst({
            where: { id: data.dealId, workspaceId: access.workspaceId },
            select: { id: true, title: true, stage: true, value: true },
          })
        : Promise.resolve(null),
      data.contactId
        ? prisma.contact.findFirst({
            where: { id: data.contactId, workspaceId: access.workspaceId },
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          })
        : Promise.resolve(null),
    ]);

    if ((data.leadId && !lead) || (data.dealId && !deal) || (data.contactId && !contact)) {
      return { error: 'Record not found in the active workspace.' };
    }

    await syncActivityToVectorStore({ activity, lead, deal, contact });

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

export async function deleteActivityAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions.' };
  }

  const rawData = {
    activityId: formData.get('activityId'),
    leadId: formData.get('leadId'),
  };

  const validatedData = activityActionSchema.safeParse(rawData);

  if (!validatedData.success) {
    return { error: validatedData.error.issues[0].message };
  }

  const data = validatedData.data;

  try {
    await prisma.activity.deleteMany({
      where: {
        id: data.activityId,
        workspaceId: access.workspaceId,
      },
    });

    if (data.leadId) {
      revalidatePath(`/dashboard/leads/${data.leadId}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to delete activity:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function togglePinActivityAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions.' };
  }

  const rawData = {
    activityId: formData.get('activityId'),
    leadId: formData.get('leadId'),
  };

  const validatedData = activityActionSchema.safeParse(rawData);

  if (!validatedData.success) {
    return { error: validatedData.error.issues[0].message };
  }

  const data = validatedData.data;

  try {
    const activity = await prisma.activity.findFirst({
      where: { id: data.activityId, workspaceId: access.workspaceId },
      select: { isPinned: true },
    });

    if (!activity) {
      return { error: 'Activity not found.' };
    }

    await prisma.activity.update({
      where: { id: data.activityId },
      data: { isPinned: !activity.isPinned },
    });

    if (data.leadId) {
      revalidatePath(`/dashboard/leads/${data.leadId}`);
    }

    return { success: true, isPinned: !activity.isPinned };
  } catch (error) {
    console.error('Failed to toggle pin:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

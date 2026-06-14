'use server';

import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { revalidatePath } from 'next/cache';

// Update deal stage
export async function updateDealStageAction(dealId: string, stage: string) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  try {
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, workspaceId: access.workspaceId },
    });

    if (!deal) return { error: 'Deal not found.' };

    const oldStage = deal.stage;

    await prisma.$transaction([
      prisma.deal.update({
        where: { id: dealId },
        data: { stage },
      }),
      prisma.activity.create({
        data: {
          type: 'SYSTEM',
          content: `Transaction stage updated from ${oldStage} to ${stage}.`,
          workspaceId: access.workspaceId,
          userId: access.userId,
          dealId: dealId,
        },
      }),
    ]);

    revalidatePath(`/dashboard/deals/${dealId}`);
    revalidatePath('/dashboard/deals');
    return { success: true };
  } catch (error) {
    console.error('Failed to update deal stage:', error);
    return { error: 'Failed to update deal stage.' };
  }
}

// Add deal expense (tax write-off)
export async function addDealExpenseAction(dealId: string, label: string, amount: number) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  try {
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, workspaceId: access.workspaceId },
    });

    if (!deal) return { error: 'Deal not found.' };

    const activity = await prisma.activity.create({
      data: {
        type: 'EXPENSE',
        content: label,
        metadata: JSON.stringify({ amount }),
        workspaceId: access.workspaceId,
        userId: access.userId,
        dealId: dealId,
      },
    });

    revalidatePath(`/dashboard/deals/${dealId}`);
    return { success: true, expense: { id: activity.id, label, amount } };
  } catch (error) {
    console.error('Failed to add expense:', error);
    return { error: 'Failed to add expense.' };
  }
}

// Delete deal expense
export async function deleteDealExpenseAction(dealId: string, activityId: string) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  try {
    await prisma.activity.delete({
      where: { id: activityId, dealId, workspaceId: access.workspaceId },
    });

    revalidatePath(`/dashboard/deals/${dealId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete expense:', error);
    return { error: 'Failed to delete expense.' };
  }
}

// Add document request
export async function addDealDocumentRequestAction(dealId: string, title: string) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  try {
    const activity = await prisma.activity.create({
      data: {
        type: 'DOCUMENT_REQUEST',
        content: title,
        metadata: JSON.stringify({ status: 'PENDING', signed: false }),
        workspaceId: access.workspaceId,
        userId: access.userId,
        dealId: dealId,
      },
    });

    revalidatePath(`/dashboard/deals/${dealId}`);
    return { success: true, document: { id: activity.id, title, status: 'PENDING', signed: false } };
  } catch (error) {
    console.error('Failed to create doc request:', error);
    return { error: 'Failed to create doc request.' };
  }
}

// Toggle document status / sign doc
export async function updateDealDocumentStatusAction(
  dealId: string, 
  activityId: string, 
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED',
  signed: boolean = false
) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  try {
    const activity = await prisma.activity.findFirst({
      where: { id: activityId, dealId, workspaceId: access.workspaceId },
    });

    if (!activity) return { error: 'Document not found.' };

    await prisma.activity.update({
      where: { id: activityId },
      data: {
        metadata: JSON.stringify({ status, signed }),
      },
    });

    // Create system log for transparency
    await prisma.activity.create({
      data: {
        type: 'SYSTEM',
        content: `Document "${activity.content}" status updated to ${status}${signed ? ' and signed' : ''}.`,
        workspaceId: access.workspaceId,
        userId: access.userId,
        dealId: dealId,
      },
    });

    revalidatePath(`/dashboard/deals/${dealId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update document status:', error);
    return { error: 'Failed to update document status.' };
  }
}

// Post transaction message
export async function addDealMessageAction(dealId: string, senderRole: string, text: string) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  try {
    const senderName = session?.user?.name || 'Agent';

    const activity = await prisma.activity.create({
      data: {
        type: 'MESSAGE',
        content: text,
        metadata: JSON.stringify({ senderName, senderRole }),
        workspaceId: access.workspaceId,
        userId: access.userId,
        dealId: dealId,
      },
    });

    revalidatePath(`/dashboard/deals/${dealId}`);
    return { success: true, message: { id: activity.id, text, senderName, senderRole, createdAt: activity.createdAt } };
  } catch (error) {
    console.error('Failed to post deal message:', error);
    return { error: 'Failed to post message.' };
  }
}

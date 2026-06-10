'use server';

import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { dealSchema } from '@/lib/validations/deal';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { syncDealToVectorStore } from '@/lib/rag';
import { AppRole, isAtLeastRole } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

export async function createDealAction(data: {
  title: string;
  value?: number | string;
  stage: string;
  contactId: string;
}) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);
  const workspaceId = access.workspaceId;

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions to add deals.' };
  }

  const rawData = {
    title: data.title,
    value: data.value,
    stage: data.stage,
    workspaceId,
    contactId: data.contactId,
  };

  const validatedData = dealSchema.safeParse(rawData);

  if (!validatedData.success) {
    return { error: validatedData.error.issues[0].message };
  }

  const { title, value, stage, contactId } = validatedData.data;

  try {
    // Verify contact belongs to workspace
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, workspaceId },
      select: { firstName: true, lastName: true, email: true },
    });

    if (!contact) {
      return { error: 'Contact not found in this workspace.' };
    }

    const deal = await prisma.deal.create({
      data: {
        title,
        value: value ? Number(value) : null,
        stage,
        workspaceId,
        contactId,
      },
    });

    try {
      await syncDealToVectorStore(deal, contact);
    } catch (vectorErr) {
      console.error('Vector store sync failed (non-fatal):', vectorErr);
    }

    revalidatePath('/dashboard/leads');
    revalidatePath(`/dashboard/leads/${contactId}`);
    return { success: true, deal };
  } catch (error) {
    console.error('Failed to create deal:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

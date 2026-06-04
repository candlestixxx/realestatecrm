'use server';

import { getServerSession } from 'next-auth/next';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';

export async function enrichLeadAction(leadId: string, data: Record<string, unknown>) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  await prisma.lead.update({
    where: { id: leadId, workspaceId: access.workspaceId },
    data: {
      socialProfiles: JSON.stringify(data),
      lastEnrichedAt: new Date(),
    },
  });

  await prisma.activity.create({
    data: {
      type: 'NOTE',
      content: `🤖 Gemini Scraper: Enriched lead with social and public records data.`,
      workspaceId: access.workspaceId,
      userId: access.userId,
      leadId: leadId,
    }
  });

  revalidatePath(`/dashboard/leads/${leadId}`);
  return { success: true };
}

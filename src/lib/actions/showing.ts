'use server';

import { getServerSession } from 'next-auth/next';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';

export async function scheduleShowingAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  const propertyAddress = formData.get('propertyAddress') as string;
  const date = formData.get('date') as string;
  const time = formData.get('time') as string;
  const dealId = formData.get('dealId') as string | null;
  const leadId = formData.get('leadId') as string | null;

  if (!propertyAddress || !date || !time) {
    return { error: 'Property address, date, and time are required.' };
  }

  // Combine date and time
  const showingDate = new Date(`${date}T${time}`);

  // --- MLS INTEGRATION MOCK ---
  // In a real environment, you would hit the ShowingTime or MLS API here.
  console.log(`[MLS API] Scheduling showing at ${propertyAddress} on ${showingDate.toLocaleString()}`);

  const content = `Scheduled showing for ${propertyAddress} on ${showingDate.toLocaleString()}`;

  const activity = await prisma.activity.create({
    data: {
      type: 'SHOWING',
      content: content,
      workspaceId: access.workspaceId,
      userId: access.userId,
      leadId: leadId || undefined,
      dealId: dealId || undefined,
    },
  });

  // Create an automated task for the agent to prepare for the showing
  await prisma.task.create({
    data: {
      title: `Prepare for showing: ${propertyAddress}`,
      description: `Pull MLS sheet and comps for showing scheduled on ${showingDate.toLocaleDateString()}.`,
      dueDate: showingDate,
      status: 'TODO',
      workspaceId: access.workspaceId,
      assignedToId: access.userId,
      leadId: leadId || undefined,
      dealId: dealId || undefined,
    }
  });

  revalidatePath('/dashboard/deals');
  if (dealId) revalidatePath(`/dashboard/deals/${dealId}`);
  if (leadId) revalidatePath(`/dashboard/leads/${leadId}`);

  return { success: true };
}

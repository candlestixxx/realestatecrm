'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { AppRole, isAtLeastRole } from '@/lib/permissions';

export async function createSearchAlertAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions to setup search alerts.' };
  }

  const leadId = formData.get('leadId') as string;
  const city = formData.get('city') as string;
  const minPrice = formData.get('minPrice') ? Number(formData.get('minPrice')) : null;
  const maxPrice = formData.get('maxPrice') ? Number(formData.get('maxPrice')) : null;
  const beds = formData.get('beds') ? Number(formData.get('beds')) : null;
  const baths = formData.get('baths') ? Number(formData.get('baths')) : null;
  const type = (formData.get('type') as string) || 'VIEW'; // VIEW, SHOWING, OFFER
  const frequency = (formData.get('frequency') as string) || 'DAILY'; // INSTANT, DAILY, WEEKLY

  if (!leadId) {
    return { error: 'Lead ID is required.' };
  }

  try {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, workspaceId: access.workspaceId },
    });

    if (!lead) {
      return { error: 'Lead not found.' };
    }

    const criteria = JSON.stringify({
      city: city || 'All Cities',
      minPrice,
      maxPrice,
      beds,
      baths,
    });

    await prisma.searchAlert.create({
      data: {
        leadId,
        criteria,
        type,
        frequency,
        isActive: true,
      },
    });

    revalidatePath(`/dashboard/leads/${leadId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to create search alert:', error);
    return { error: 'An unexpected error occurred while saving.' };
  }
}

export async function deleteSearchAlertAction(alertId: string, leadId: string) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions.' };
  }

  try {
    await prisma.searchAlert.delete({
      where: { id: alertId },
    });

    revalidatePath(`/dashboard/leads/${leadId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete search alert:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

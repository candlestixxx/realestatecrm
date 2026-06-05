'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { AppRole, isAtLeastRole } from '@/lib/permissions';

export async function createCampaignAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions.' };
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const workspaceId = access.workspaceId;

  if (!name) {
    return { error: 'Campaign name is required.' };
  }

  try {
    const campaign = await prisma.smartPlan.create({
      data: {
        name,
        description: description || null,
        workspaceId,
        isActive: true,
        steps: JSON.stringify([
          {
            id: '1',
            type: 'EMAIL',
            delayDays: 0,
            subject: 'Welcome to our Agency!',
            content: 'Hi! Thanks for reaching out. Let us know how we can help you find your dream home.',
          },
          {
            id: '2',
            type: 'SMS',
            delayDays: 1,
            content: 'Hi, just following up to see if you received our email yesterday? Let us know if you want to chat!',
          },
          {
            id: '3',
            type: 'CALL',
            delayDays: 3,
            content: 'Schedule follow up introduction call.',
          }
        ]),
      },
    });

    revalidatePath('/dashboard/campaigns');
    return { success: true, campaignId: campaign.id };
  } catch (error) {
    console.error('Failed to create campaign:', error);
    return { error: 'An unexpected error occurred while saving.' };
  }
}

export async function updateCampaignStepsAction(campaignId: string, stepsJson: string) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions.' };
  }

  try {
    await prisma.smartPlan.update({
      where: { id: campaignId, workspaceId: access.workspaceId },
      data: { steps: stepsJson },
    });

    revalidatePath('/dashboard/campaigns');
    return { success: true };
  } catch (error) {
    console.error('Failed to update campaign steps:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function toggleCampaignStatusAction(campaignId: string, isActive: boolean) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions.' };
  }

  try {
    await prisma.smartPlan.update({
      where: { id: campaignId, workspaceId: access.workspaceId },
      data: { isActive },
    });

    revalidatePath('/dashboard/campaigns');
    return { success: true };
  } catch (error) {
    console.error('Failed to toggle campaign status:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function enrollLeadInCampaignAction(leadId: string, campaignId: string | null) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions.' };
  }

  try {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, workspaceId: access.workspaceId },
    });

    if (!lead) {
      return { error: 'Lead not found.' };
    }

    let campaignName = 'None';
    if (campaignId) {
      const campaign = await prisma.smartPlan.findUnique({
        where: { id: campaignId },
      });
      if (campaign) {
        campaignName = campaign.name;
      }
    }

    await prisma.$transaction([
      prisma.lead.update({
        where: { id: leadId },
        data: { smartPlanId: campaignId },
      }),
      prisma.activity.create({
        data: {
          type: 'SYSTEM',
          content: campaignId
            ? `Enrolled in Drip Campaign: "${campaignName}"`
            : `Unenrolled from current Drip Campaign.`,
          workspaceId: access.workspaceId,
          userId: access.userId,
          leadId: leadId,
        },
      }),
    ]);

    revalidatePath(`/dashboard/leads/${leadId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to enroll lead in campaign:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { AppRole, isAtLeastRole } from '@/lib/permissions';
import { enrollLeadInCampaignSteps } from '@/lib/campaign-processor';

export async function createCampaignAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions.' };
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const scope = (formData.get('scope') as string) || 'COMPANY';
  const leadType = (formData.get('leadType') as string) || 'BOTH';
  const autoApplyTrigger = (formData.get('autoApplyTrigger') as string) || 'NONE';
  const autoApplyCriteria = (formData.get('autoApplyCriteria') as string) || '';
  const autoPauseOn = (formData.get('autoPauseOn') as string) || 'REPLY';
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
        steps: JSON.stringify({
          settings: {
            scope,
            leadType,
            autoApplyTrigger,
            autoApplyCriteria,
            autoPauseOn,
          },
          items: [
            {
              id: '1',
              type: 'EMAIL',
              delayValue: 0,
              delayUnit: 'DAY',
              title: 'Welcome to our Agency!',
              subject: 'Welcome to our Agency!',
              content: 'Hi! Thanks for reaching out. Let us know how we can help you find your dream home.',
            },
            {
              id: '2',
              type: 'SMS',
              delayValue: 1,
              delayUnit: 'DAY',
              title: 'Welcome SMS follow up',
              content: 'Hi, just following up to see if you received our email yesterday? Let us know if you want to chat!',
            },
            {
              id: '3',
              type: 'CALL',
              delayValue: 3,
              delayUnit: 'DAY',
              title: 'Schedule intro call',
              content: 'Schedule follow up introduction call.',
            }
          ]
        }),
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

    // Generate tasks and initiate scheduling for the campaign
    await enrollLeadInCampaignSteps(leadId, campaignId, access.workspaceId, access.userId);

    revalidatePath(`/dashboard/leads/${leadId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to enroll lead in campaign:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function bulkEnrollLeadsInCampaignAction(leadIds: string[], campaignId: string | null) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions.' };
  }

  if (!leadIds || leadIds.length === 0) {
    return { error: 'No leads selected.' };
  }

  try {
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
      prisma.lead.updateMany({
        where: {
          id: { in: leadIds },
          workspaceId: access.workspaceId,
        },
        data: { smartPlanId: campaignId },
      }),
      ...leadIds.map((leadId) =>
        prisma.activity.create({
          data: {
            type: 'SYSTEM',
            content: campaignId
              ? `Enrolled in Drip Campaign: "${campaignName}" (Bulk)`
              : `Unenrolled from current Drip Campaign (Bulk).`,
            workspaceId: access.workspaceId,
            userId: access.userId,
            leadId,
          },
        })
      ),
    ]);

    // Generate tasks for all bulk enrolled leads
    for (const leadId of leadIds) {
      await enrollLeadInCampaignSteps(leadId, campaignId, access.workspaceId, access.userId);
    }

    revalidatePath('/dashboard/leads');
    return { success: true };
  } catch (error) {
    console.error('Failed bulk campaign enrollment:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function importCampaignTemplateAction(name: string, description: string, stepsJson: string) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions.' };
  }

  try {
    let formattedSteps = stepsJson;
    try {
      const parsed = JSON.parse(stepsJson);
      if (Array.isArray(parsed)) {
        // Wrap array in settings structure
        const leadType = name.toLowerCase().includes('buyer') ? 'BUYER' : name.toLowerCase().includes('seller') || name.toLowerCase().includes('fsbo') || name.toLowerCase().includes('foreclosure') ? 'SELLER' : 'BOTH';
        formattedSteps = JSON.stringify({
          settings: {
            scope: 'COMPANY',
            leadType: leadType,
            autoApplyTrigger: 'NONE',
            autoApplyCriteria: '',
            autoPauseOn: 'REPLY',
          },
          items: parsed,
        });
      }
    } catch (e) {
      console.error('Failed to parse steps during template import:', e);
    }

    const campaign = await prisma.smartPlan.create({
      data: {
        name,
        description: description || null,
        steps: formattedSteps,
        workspaceId: access.workspaceId,
        isActive: true,
      },
    });

    revalidatePath('/dashboard/campaigns');
    return { success: true, campaignId: campaign.id };
  } catch (error) {
    console.error('Failed to import campaign template:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function deleteCampaignAction(campaignId: string) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions.' };
  }

  try {
    // Also delete any pending tasks associated with this campaign
    const campaign = await prisma.smartPlan.findUnique({
      where: { id: campaignId },
    });
    if (campaign) {
      await prisma.task.deleteMany({
        where: {
          title: { startsWith: `[Drip: ${campaign.name}]` },
          status: 'TODO',
        },
      });
    }

    await prisma.smartPlan.delete({
      where: { id: campaignId, workspaceId: access.workspaceId },
    });

    revalidatePath('/dashboard/campaigns');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete campaign:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function toggleCampaignAutoApplyAction(campaignId: string, autoApply: boolean) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions.' };
  }

  try {
    await prisma.smartPlan.update({
      where: { id: campaignId, workspaceId: access.workspaceId },
      data: { autoApply },
    });

    revalidatePath('/dashboard/campaigns');
    return { success: true };
  } catch (error) {
    console.error('Failed to toggle campaign autoApply:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

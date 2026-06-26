'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { AppRole, isAtLeastRole } from '@/lib/permissions';

export async function createLandingPageAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions to create landing pages.' };
  }

  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const subdomain = formData.get('subdomain') as string;

  if (!title || !slug) {
    return { error: 'Title and URL slug are required.' };
  }

  const workspaceId = access.workspaceId;

  try {
    const existing = await prisma.landingPage.findUnique({
      where: { slug },
    });

    if (existing) {
      return { error: 'URL slug is already in use by another landing page.' };
    }

    const defaultBlocks = [
      {
        id: 'header',
        type: 'HEADER',
        title: title,
        subtitle: 'Welcome to your real estate marketing portal. Let us find your dream property together.',
      },
      {
        id: 'video',
        type: 'VIDEO',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        title: 'Watch Our Featured Tour',
      },
      {
        id: 'property',
        type: 'PROPERTY',
        address: '123 Excel Legacy Lane, Metro Detroit, MI',
        price: 499000,
        beds: 4,
        baths: 3,
        remarks: 'Beautiful custom single-family home with modern kitchen and sprawling lakefront views.',
      },
      {
        id: 'leadCapture',
        type: 'LEAD_CAPTURE',
        ctaText: 'Get Free Market Valuation & Listing Alerts',
      }
    ];

    const landingPage = await prisma.landingPage.create({
      data: {
        title,
        slug,
        subdomain: subdomain || null,
        blocks: JSON.stringify(defaultBlocks),
        workspaceId,
        ownerId: access.userId,
      },
    });

    revalidatePath('/dashboard/agent-websites');
    return { success: true, landingPageId: landingPage.id };
  } catch (error) {
    console.error('Failed to create landing page:', error);
    return { error: 'An unexpected error occurred while saving.' };
  }
}

export async function updateLandingPageBlocksAction(landingPageId: string, blocksJson: string) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions.' };
  }

  try {
    await prisma.landingPage.update({
      where: { id: landingPageId, workspaceId: access.workspaceId },
      data: { blocks: blocksJson },
    });

    revalidatePath('/dashboard/agent-websites');
    return { success: true };
  } catch (error) {
    console.error('Failed to update landing page blocks:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function submitLandingPageLeadAction(
  workspaceId: string,
  landingPageTitle: string,
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    type: 'BUYER' | 'SELLER';
  }
) {
  try {
    // Create new Contact
    const contact = await prisma.contact.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        workspaceId,
      },
    });

    // Create new Lead associated with the Contact
    const lead = await prisma.lead.create({
      data: {
        type: data.type,
        status: 'NEW',
        workspaceId,
        contactId: contact.id,
        source: `Landing Page: ${landingPageTitle}`,
        tags: 'landingpage, inbound',
      },
    });

    // Create system log
    await prisma.activity.create({
      data: {
        type: 'SYSTEM',
        content: `Lead captured inbound from published landing page "${landingPageTitle}"`,
        workspaceId,
        leadId: lead.id,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to save inbound lead:', error);
    return { error: 'Failed to submit lead information.' };
  }
}

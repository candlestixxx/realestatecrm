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
  const template = formData.get('template') as string || 'custom';

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

    const settingsBlock = {
      id: 'settings',
      type: 'SETTINGS',
      pageStyle: 'With simple header, no footer',
      leadSource: 'Website',
      leadType: template.includes('seller') ? 'Seller' : 'Buyer',
      registrationTrigger: 'Require registration based on Browsing Time',
      browsingTime: 8,
      youtubeUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      customVideoUrl: '',
      videoType: 'YOUTUBE',
    };

    const defaultBlocks = [settingsBlock];

    if (template === 'feature-listing') {
      defaultBlocks.push(
        {
          id: 'header',
          type: 'HEADER',
          title: 'Premium Listing Highlight',
          subtitle: 'Welcome to this beautiful estate. Schedule a tour to experience it in person.',
        } as any,
        {
          id: 'property',
          type: 'PROPERTY',
          address: '6026 Via Toscana Street, Troy, MI 48085',
          price: 649725,
          beds: 4,
          baths: 3,
          remarks: 'Stunning luxury colonial home in Troy, Michigan. Features gorgeous open layout, premium kitchen, and landscaped yard.',
        } as any,
        {
          id: 'video',
          type: 'VIDEO',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          title: 'Watch the Property Walkthrough Video',
        } as any,
        {
          id: 'leadCapture',
          type: 'LEAD_CAPTURE',
          ctaText: 'Register to Schedule a Tour',
        } as any
      );
    } else if (template === 'search-campaign') {
      defaultBlocks.push(
        {
          id: 'header',
          type: 'HEADER',
          title: 'Start Your Listing Search Today',
          subtitle: 'Search thousands of active MLS properties and schedule real-time tour notifications.',
        } as any,
        {
          id: 'leadCapture',
          type: 'LEAD_CAPTURE',
          ctaText: 'Start Searching Listings Now',
        } as any
      );
    } else if (template === 'lead-registration') {
      defaultBlocks.push(
        {
          id: 'header',
          type: 'HEADER',
          title: 'Join Our Exclusive Home Buyers Club',
          subtitle: 'Unlock access to off-market listings, price drops, and upcoming open houses before anyone else.',
        } as any,
        {
          id: 'leadCapture',
          type: 'LEAD_CAPTURE',
          ctaText: 'Join VIP Registration List',
        } as any
      );
    } else if (template === 'area-intro') {
      defaultBlocks.push(
        {
          id: 'header',
          type: 'HEADER',
          title: 'Explore Troy, Michigan & Local Neighborhoods',
          subtitle: 'Learn about schools, neighborhood vibes, listing price averages, and market analytics.',
        } as any,
        {
          id: 'property',
          type: 'PROPERTY',
          address: 'Troy School District Neighborhoods',
          price: 550000,
          beds: 4,
          baths: 3,
          remarks: 'Average listing prices in Troy range from $400k to $900k. Excellent school ratings and vibrant parks.',
        } as any,
        {
          id: 'leadCapture',
          type: 'LEAD_CAPTURE',
          ctaText: 'Download Neighborhood Report',
        } as any
      );
    } else if (template === 'buyer-guide') {
      defaultBlocks.push(
        {
          id: 'header',
          type: 'HEADER',
          title: 'Free Home Buyer Guide',
          subtitle: 'Download our comprehensive 2026 Home Buyer Guide to master financing, searching, and closing.',
        } as any,
        {
          id: 'video',
          type: 'VIDEO',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          title: 'Watch the Guide Overview Video',
        } as any,
        {
          id: 'leadCapture',
          type: 'LEAD_CAPTURE',
          ctaText: 'Download Free Buyer Guide',
        } as any
      );
    } else if (template === 'seller-guide') {
      defaultBlocks.push(
        {
          id: 'header',
          type: 'HEADER',
          title: 'Sell For Top Dollar - Free Seller Guide',
          subtitle: 'Get pricing secrets, staging strategies, and custom evaluation details from local listing experts.',
        } as any,
        {
          id: 'leadCapture',
          type: 'LEAD_CAPTURE',
          ctaText: 'Claim Free Seller Handbook & Valuation',
        } as any
      );
    } else {
      // Default / Custom empty template
      defaultBlocks.push(
        {
          id: 'header',
          type: 'HEADER',
          title: title,
          subtitle: 'Welcome to your real estate marketing portal. Let us find your dream property together.',
        } as any,
        {
          id: 'leadCapture',
          type: 'LEAD_CAPTURE',
          ctaText: 'Get Free Market Valuation & Listing Alerts',
        } as any
      );
    }

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

export async function deleteLandingPageAction(landingPageId: string) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions.' };
  }

  try {
    await prisma.landingPage.delete({
      where: { id: landingPageId, workspaceId: access.workspaceId },
    });

    revalidatePath('/dashboard/agent-websites');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete landing page:', error);
    return { error: 'An unexpected error occurred while deleting.' };
  }
}

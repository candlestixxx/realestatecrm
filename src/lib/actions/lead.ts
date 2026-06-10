'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { AppRole, isAtLeastRole } from '@/lib/permissions';

export async function updateLeadTagsAction(leadId: string, tags: string) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions to update tags.' };
  }

  try {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, workspaceId: access.workspaceId },
    });

    if (!lead) {
      return { error: 'Lead not found.' };
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: { tags: tags || null },
    });

    revalidatePath(`/dashboard/leads/${leadId}`);
    revalidatePath('/dashboard/leads');
    return { success: true };
  } catch (error) {
    console.error('Failed to update tags:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function updateLeadStatusAction(leadId: string, status: string) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions to update status.' };
  }

  try {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, workspaceId: access.workspaceId },
      include: { contact: true },
    });

    if (!lead) {
      return { error: 'Lead not found.' };
    }

    const oldStatus = lead.status;
    if (oldStatus === status) {
      return { success: true };
    }

    await prisma.$transaction([
      prisma.lead.update({
        where: { id: leadId },
        data: { status },
      }),
      prisma.activity.create({
        data: {
          type: 'SYSTEM',
          content: `Status changed from ${oldStatus} to ${status}.`,
          workspaceId: access.workspaceId,
          userId: access.userId,
          leadId: leadId,
        },
      }),
    ]);

    revalidatePath(`/dashboard/leads/${leadId}`);
    revalidatePath('/dashboard/leads');
    return { success: true };
  } catch (error) {
    console.error('Failed to update status:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function updateLeadContactDetailsAction(
  leadId: string,
  data: {
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    additionalPhones?: string[];
    additionalEmails?: string[];
    spouseName?: string;
    spousePhone?: string;
    spouseEmail?: string;
    familyMembers?: { name: string; relationship: string; age?: string }[];
  }
) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions to update lead contact details.' };
  }

  try {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, workspaceId: access.workspaceId },
      include: { contact: true },
    });

    if (!lead) {
      return { error: 'Lead not found.' };
    }

    await prisma.contact.update({
      where: { id: lead.contactId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        additionalPhones: data.additionalPhones ? JSON.stringify(data.additionalPhones) : null,
        additionalEmails: data.additionalEmails ? JSON.stringify(data.additionalEmails) : null,
        spouseName: data.spouseName || null,
        spousePhone: data.spousePhone || null,
        spouseEmail: data.spouseEmail || null,
        familyMembers: data.familyMembers ? JSON.stringify(data.familyMembers) : null,
      },
    });

    revalidatePath(`/dashboard/leads/${leadId}`);
    revalidatePath('/dashboard/leads');
    return { success: true };
  } catch (error) {
    console.error('Failed to update lead contact details:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function deleteLeadAction(leadId: string) {
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

    // Delete the lead (Contact cascade delete handles contact if specified in schema, but we should make sure we delete Contact too if Cascade is not default)
    await prisma.$transaction([
      prisma.lead.delete({
        where: { id: leadId },
      }),
      prisma.contact.delete({
        where: { id: lead.contactId },
      }),
    ]);

    revalidatePath('/dashboard/leads');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete lead:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function importLeadsBulkAction(
  leads: Array<{
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    status?: string;
    type?: string;
    source?: string;
    tags?: string;
    notes?: string;
    address?: string;
    additionalPhones?: string;
    additionalEmails?: string;
    spouseName?: string;
    spousePhone?: string;
    spouseEmail?: string;
    familyMembers?: string;
  }>,
  segmentId?: string,
  segmentName?: string
) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions.' };
  }

  try {
    let targetSegmentId = segmentId || null;

    // Create custom segment if name is provided and doesn't exist
    if (segmentName && segmentName.trim()) {
      const existingSegment = await prisma.segment.findFirst({
        where: {
          name: segmentName.trim(),
          workspaceId: access.workspaceId,
        },
      });

      if (existingSegment) {
        targetSegmentId = existingSegment.id;
      } else {
        const newSegment = await prisma.segment.create({
          data: {
            name: segmentName.trim(),
            workspaceId: access.workspaceId,
          },
        });
        targetSegmentId = newSegment.id;
      }
    }

    let imported = 0;
    let errors = 0;

    for (const data of leads) {
      if (!data.firstName) continue;

      try {
        const contact = await prisma.contact.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName || null,
            email: data.email || null,
            phone: data.phone || null,
            address: data.address || null,
            workspaceId: access.workspaceId,
            additionalPhones: data.additionalPhones ? (
              data.additionalPhones.startsWith('[') ? data.additionalPhones : JSON.stringify(data.additionalPhones.split(',').map(p => p.trim()).filter(Boolean))
            ) : null,
            additionalEmails: data.additionalEmails ? (
              data.additionalEmails.startsWith('[') ? data.additionalEmails : JSON.stringify(data.additionalEmails.split(',').map(e => e.trim()).filter(Boolean))
            ) : null,
            spouseName: data.spouseName || null,
            spousePhone: data.spousePhone || null,
            spouseEmail: data.spouseEmail || null,
            familyMembers: data.familyMembers || null,
          },
        });

        const lead = await prisma.lead.create({
          data: {
            status: data.status || 'NEW',
            source: data.source || 'CSV Import',
            type: data.type || 'BUYER',
            tags: data.tags || null,
            workspaceId: access.workspaceId,
            contactId: contact.id,
            userId: access.userId,
            ...(targetSegmentId && {
              segments: {
                connect: { id: targetSegmentId },
              },
            }),
          },
        });

        if (data.notes) {
          await prisma.activity.create({
            data: {
              type: 'NOTE',
              content: `Note from Import:\n"${data.notes}"`,
              workspaceId: access.workspaceId,
              userId: access.userId,
              leadId: lead.id,
            },
          });
        }

        imported++;
      } catch (err) {
        console.error('Import lead row failed:', err);
        errors++;
      }
    }

    revalidatePath('/dashboard/leads');
    return { success: true, imported, errors };
  } catch (error) {
    console.error('Failed to execute bulk import:', error);
    return { error: 'An unexpected error occurred during bulk import.' };
  }
}



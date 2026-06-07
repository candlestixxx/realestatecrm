'use server';

import { getServerSession } from 'next-auth/next';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { AppRole, isAtLeastRole } from '@/lib/permissions';
import { sendMail } from '@/lib/email-config';

export async function sendEmailAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  const email = formData.get('email') as string;
  const subject = formData.get('subject') as string || 'CRM Follow-up';
  const message = formData.get('message') as string;
  const leadId = formData.get('leadId') as string | null;

  if (!email || !message) {
    return { error: 'Email and message content are required.' };
  }

  try {
    await sendMail({ to: email, subject, message });
  } catch (err: any) {
    console.error('[Email Action] Error dispatching mail:', err);
    return { error: err.message || 'Failed to dispatch email. Check settings configuration.' };
  }

  if (leadId) {
    // Log the communication in the CRM timeline
    await prisma.activity.create({
      data: {
        type: 'EMAIL',
        content: `Sent Email to ${email} (Subject: ${subject}):\n\n${message}`,
        workspaceId: access.workspaceId,
        userId: access.userId,
        leadId: leadId,
      },
    });
  }

  revalidatePath('/dashboard/leads');
  if (leadId) revalidatePath(`/dashboard/leads/${leadId}`);

  return { success: true };
}

export async function sendMassEmailToSegmentAction(segmentId: string, subject: string, message: string) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions.' };
  }

  try {
    const segment = await prisma.segment.findFirst({
      where: { id: segmentId, workspaceId: access.workspaceId },
      include: { leads: { include: { contact: true } } },
    });

    if (!segment) {
      return { error: 'Segment not found.' };
    }

    const emailList = segment.leads
      .map((lead) => lead.contact.email)
      .filter((email): email is string => !!email);

    if (emailList.length === 0) {
      return { error: 'No leads in this segment have valid email addresses.' };
    }

    let sentCount = 0;

    for (const toEmail of emailList) {
      try {
        await sendMail({ to: toEmail, subject, message });
        sentCount++;
      } catch (err) {
        console.error(`Failed bulk email delivery to ${toEmail}:`, err);
      }
    }

    await prisma.activity.create({
      data: {
        type: 'EMAIL',
        content: `Bulk Email sent to Segment: "${segment.name}" (Subject: ${subject}). Sent to ${sentCount} recipients.`,
        workspaceId: access.workspaceId,
        userId: access.userId,
      },
    });

    revalidatePath('/dashboard/segments');
    revalidatePath('/dashboard/leads');

    return { success: true, sentCount };
  } catch (error) {
    console.error('Failed to send mass email:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

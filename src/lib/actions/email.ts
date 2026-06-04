'use server';

import { getServerSession } from 'next-auth/next';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';

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

  // --- RESEND API INTEGRATION ---
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || 'crm@excellegacyrealty.com';

  if (resendApiKey) {
    try {
      console.log(`[Email API] Sending real Resend email to ${email}...`);
      const resendUrl = 'https://api.resend.com/emails';
      
      const res = await fetch(resendUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Excel Legacy Realty <${fromEmail}>`,
          to: [email],
          subject: subject,
          text: message,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[Email API] Resend error response:', errorText);
        return { error: `Resend failed: ${res.statusText}` };
      }
      console.log(`[Email API] Resend email successfully sent to ${email}`);
    } catch (err) {
      console.error('[Email API] Resend connection error:', err);
      return { error: 'Failed to establish connection to Resend API.' };
    }
  } else {
    // Fallback simulation for local dev without credentials
    console.log(`[Email API] [SIMULATION] Sending email to ${email}: Subject: "${subject}", Content: "${message}"`);
    await new Promise((resolve) => setTimeout(resolve, 800));
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
  revalidatePath(`/dashboard/leads/${leadId}`);

  return { success: true };
}

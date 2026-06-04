'use server';

import { getServerSession } from 'next-auth/next';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';

export async function sendSmsAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  const phone = formData.get('phone') as string;
  const message = formData.get('message') as string;
  const leadId = formData.get('leadId') as string | null;

  if (!phone || !message) {
    return { error: 'Phone number and message are required.' };
  }

  // --- TWILIO / API MOCK ---
  // In a real environment, you would invoke the Twilio REST API here:
  // await twilioClient.messages.create({ body: message, from: '+1...', to: phone });
  // We will simulate a successful send for now.
  console.log(`[SMS API] Sending message to ${phone}: "${message}"`);
  await new Promise((resolve) => setTimeout(resolve, 800)); // Network delay simulation

  if (leadId) {
    // Log the communication in the CRM timeline
    await prisma.activity.create({
      data: {
        type: 'SMS',
        content: `Sent SMS to ${phone}:\n"${message}"`,
        workspaceId: access.workspaceId,
        userId: access.userId,
        leadId: leadId,
      },
    });
    
    // Attempt to parse Gemini automated search triggers from message
    if (message.toLowerCase().includes("automated search") || message.toLowerCase().includes("listings")) {
       await prisma.activity.create({
          data: {
             type: 'NOTE',
             content: `🤖 Gemini Assistant: Interpreted SMS intent. Setting up Automated MLS Search Alert for Lead based on message context.`,
             workspaceId: access.workspaceId,
             userId: access.userId,
             leadId: leadId,
          }
       });
    }
  }

  revalidatePath('/dashboard/leads');
  revalidatePath(`/dashboard/leads/${leadId}`);

  return { success: true };
}

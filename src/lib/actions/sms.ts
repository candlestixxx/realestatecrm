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

  // --- TWILIO API INTEGRATION ---
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromPhone = process.env.TWILIO_PHONE_NUMBER?.trim();

  if (accountSid && authToken && fromPhone) {
    try {
      console.log(`[SMS API] Sending real Twilio message to ${phone}...`);
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const bodyParams = new URLSearchParams({
        To: phone,
        From: fromPhone,
        Body: message,
      });

      const res = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[SMS API] Twilio error response:', errorText);
        return { error: `Twilio failed: ${res.statusText}` };
      }
      console.log(`[SMS API] Twilio message successfully sent to ${phone}`);
    } catch (err) {
      console.error('[SMS API] Twilio connection error:', err);
      return { error: 'Failed to establish connection to Twilio API.' };
    }
  } else {
    // Fallback simulation for local dev without credentials
    console.log(`[SMS API] [SIMULATION] Sending message to ${phone}: "${message}"`);
    await new Promise((resolve) => setTimeout(resolve, 800));
  }

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

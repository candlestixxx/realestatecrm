'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { getEmailConfig, saveEmailConfig, sendMail, EmailConfig } from '@/lib/email-config';
import { revalidatePath } from 'next/cache';
import { AppRole, isAtLeastRole } from '@/lib/permissions';

export async function saveEmailSettingsAction(data: EmailConfig) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions to save settings.' };
  }

  try {
    await saveEmailConfig(data);
    revalidatePath('/dashboard/settings/email');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to save email settings:', error);
    return { error: error.message || 'An unexpected error occurred while saving.' };
  }
}

export async function sendTestEmailAction(toEmail: string) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions to send test emails.' };
  }

  if (!toEmail) {
    return { error: 'Recipient email is required.' };
  }

  try {
    const config = await getEmailConfig();
    const result = await sendMail({
      to: toEmail,
      subject: 'CRM Email Integration Test ✔',
      message: `Hello! This is a test email sent from your Excel Legacy CRM Email Integration hub.

Your configured provider is: ${config.provider}.
Everything is set up correctly and ready to automate drip plans or bulk marketing campaigns!

Best regards,
Excel Legacy Admin`,
    });

    return { success: true, mode: result.mode };
  } catch (error: any) {
    console.error('Failed to dispatch test email:', error);
    return { error: error.message || 'Verification email failed to send.' };
  }
}

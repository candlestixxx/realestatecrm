'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function saveMyPlusLeadsCredentialsAction(data: {
  email: string;
  passwordRaw: string;
  isActive: boolean;
  workspaceId: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Determine if it exists
  const existing = await prisma.myPlusLeadsIntegration.findUnique({
    where: { workspaceId: data.workspaceId },
  });

  if (existing) {
    await prisma.myPlusLeadsIntegration.update({
      where: { id: existing.id },
      data: {
        email: data.email,
        password: data.passwordRaw, // We store raw here, and myplusleads.ts hashes it before sending
        isActive: data.isActive,
      },
    });
  } else {
    await prisma.myPlusLeadsIntegration.create({
      data: {
        workspaceId: data.workspaceId,
        email: data.email,
        password: data.passwordRaw,
        isActive: data.isActive,
      },
    });
  }

  revalidatePath('/dashboard/settings/integrations');
  return { success: true };
}

export async function manualSyncMyPlusLeadsAction() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // To manually trigger the sync, we can just call our own API route locally.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${appUrl}/api/cron/myplusleads`);
  
  if (!res.ok) {
    throw new Error('Manual sync failed');
  }
  
  revalidatePath('/dashboard/leads');
  revalidatePath('/dashboard/settings/integrations');
  return await res.json();
}

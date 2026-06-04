'use server';

import { getServerSession } from 'next-auth/next';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';

export async function createWorkspaceAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: 'Not authenticated.' };
  }

  const name = formData.get('name') as string;
  if (!name) {
    return { error: 'Segment name is required.' };
  }

  try {
    const workspace = await prisma.workspace.create({
      data: {
        name,
        members: {
          create: {
            userId: session.user.id,
            role: 'OWNER',
          },
        },
      },
    });

    revalidatePath('/dashboard');
    return { success: true, workspaceId: workspace.id };
  } catch (error) {
    console.error('Failed to create workspace:', error);
    return { error: 'Failed to create segment.' };
  }
}

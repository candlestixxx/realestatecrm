'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import prisma from '@/lib/prisma';
import { taskSchema } from '@/lib/validations/task';
import { AppRole, isAtLeastRole } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

export async function addTaskAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);
  const workspaceId = access.workspaceId;

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions to add tasks.' };
  }

  const rawData = {
    title: formData.get('title'),
    description: formData.get('description'),
    status: formData.get('status') || 'TODO',
    workspaceId, // Override client value
    dueDate: formData.get('dueDate'),
    assignedToId: formData.get('assignedToId'),
    triggerEmail: formData.get('triggerEmail') === 'true',
    triggerSMS: formData.get('triggerSMS') === 'true',
    triggerCall: formData.get('triggerCall') === 'true',
  };

  const leadId = formData.get('leadId') as string | null;

  if (rawData.workspaceId !== access.workspaceId) {
    return { error: 'Workspace access denied.' };
  }

  const validatedData = taskSchema.safeParse(rawData);

  if (!validatedData.success) {
    return { error: validatedData.error.issues[0].message };
  }

  const { title, description, status, dueDate, assignedToId, triggerEmail, triggerSMS, triggerCall } = validatedData.data;

  try {
    if (assignedToId) {
      // Verify assignee is in workspace
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: { userId: assignedToId, workspaceId },
        },
      });
      if (!membership) {
        return { error: 'Assigned user is not a member of this workspace.' };
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        status,
        workspaceId,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedToId: assignedToId || null,
        leadId: leadId || null,
        triggerEmail: triggerEmail || false,
        triggerSMS: triggerSMS || false,
        triggerCall: triggerCall || false,
      },
    });

    if (assignedToId && (triggerEmail || triggerSMS || triggerCall)) {
      const assigneeUser = await prisma.user.findUnique({ where: { id: assignedToId } });
      const triggerList = [
        triggerEmail ? 'Email' : null,
        triggerSMS ? 'Text/SMS' : null,
        triggerCall ? 'Call Task Phone Alert' : null,
      ].filter(Boolean).join(', ');

      await prisma.activity.create({
        data: {
          type: 'SYSTEM',
          content: `Task alerts triggered & sent to user ${assigneeUser?.name || assigneeUser?.email || assignedToId} via: ${triggerList}`,
          workspaceId,
          userId: access.userId,
          leadId: leadId || null,
        },
      });
    }

    revalidatePath('/dashboard/tasks');
    if (leadId) {
      revalidatePath(`/dashboard/leads/${leadId}`);
      revalidatePath('/dashboard/leads');
    }
  } catch (error) {
    console.error('Failed to add task:', error);
    return { error: 'An unexpected error occurred while saving.' };
  }
}

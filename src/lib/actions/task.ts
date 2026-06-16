'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import prisma from '@/lib/prisma';
import { taskSchema, taskActionSchema, taskUpdateSchema } from '@/lib/validations/task';
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
    workspaceId,
    dueDate: formData.get('dueDate'),
    dueTime: formData.get('dueTime'),
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

  const { title, description, status, dueDate, dueTime, assignedToId, triggerEmail, triggerSMS, triggerCall } = validatedData.data;

  try {
    if (assignedToId) {
      const membership = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: assignedToId, workspaceId } },
      });
      if (!membership) {
        return { error: 'Assigned user is not a member of this workspace.' };
      }
    }

    // Combine date + time into a single datetime
    let dueDateTime: Date | null = null;
    if (dueDate) {
      dueDateTime = dueTime ? new Date(`${dueDate}T${dueTime}:00`) : new Date(`${dueDate}T00:00:00`);
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        status,
        workspaceId,
        dueDate: dueDateTime,
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

export async function updateTaskAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);
  const workspaceId = access.workspaceId;

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions to update tasks.' };
  }

  const rawData = {
    taskId: formData.get('taskId'),
    title: formData.get('title'),
    description: formData.get('description'),
    status: formData.get('status') || 'TODO',
    dueDate: formData.get('dueDate'),
    dueTime: formData.get('dueTime'),
    leadId: formData.get('leadId'),
  };

  const validatedData = taskUpdateSchema.safeParse(rawData);

  if (!validatedData.success) {
    return { error: validatedData.error.issues[0].message };
  }

  const { taskId, title, description, status, dueDate, dueTime, leadId } = validatedData.data;

  try {
    // Combine date + time into a single datetime
    let dueDateTime: Date | null = null;
    if (dueDate) {
      dueDateTime = dueTime ? new Date(`${dueDate}T${dueTime}:00`) : new Date(`${dueDate}T00:00:00`);
    }

    await prisma.task.updateMany({
      where: { id: taskId, workspaceId },
      data: {
        title,
        description: description || null,
        status,
        dueDate: dueDateTime,
      },
    });

    revalidatePath('/dashboard/tasks');
    if (leadId) {
      revalidatePath(`/dashboard/leads/${leadId}`);
    }
    return { success: true };
  } catch (error) {
    console.error('Failed to update task:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function deleteTaskAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions.' };
  }

  const rawData = {
    taskId: formData.get('taskId'),
    leadId: formData.get('leadId'),
  };

  const validatedData = taskActionSchema.safeParse(rawData);

  if (!validatedData.success) {
    return { error: validatedData.error.issues[0].message };
  }

  const { taskId, leadId } = validatedData.data;

  try {
    await prisma.task.deleteMany({
      where: { id: taskId, workspaceId: access.workspaceId },
    });

    if (leadId) revalidatePath(`/dashboard/leads/${leadId}`);
    revalidatePath('/dashboard/tasks');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete task:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function toggleTaskStatusAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions.' };
  }

  const rawData = {
    taskId: formData.get('taskId'),
    leadId: formData.get('leadId'),
  };

  const validatedData = taskActionSchema.safeParse(rawData);

  if (!validatedData.success) {
    return { error: validatedData.error.issues[0].message };
  }

  const { taskId, leadId } = validatedData.data;

  try {
    const task = await prisma.task.findFirst({
      where: { id: taskId, workspaceId: access.workspaceId },
      select: { status: true },
    });

    if (!task) return { error: 'Task not found.' };

    const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';

    await prisma.task.update({
      where: { id: taskId },
      data: { status: newStatus },
    });

    if (leadId) revalidatePath(`/dashboard/leads/${leadId}`);
    revalidatePath('/dashboard/tasks');
    return { success: true, status: newStatus };
  } catch (error) {
    console.error('Failed to toggle task:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

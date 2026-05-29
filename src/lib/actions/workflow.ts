'use server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceRole, requireWorkspaceAccess } from '@/lib/workspace-access';

import prisma from '@/lib/prisma';
import { workflowSessionSchema } from '@/lib/validations/workflow';

export async function saveWorkflowSession(
  workspaceId: string,
  type: string,
  data: string,
  existingSessionId?: string | null,
  leadId?: string,
  dealId?: string,
) {
  const rawData = {
    workspaceId,
    type,
    data,
    existingSessionId: existingSessionId || undefined,
    leadId: leadId || undefined,
    dealId: dealId || undefined,
  };

  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);
  if (rawData.workspaceId !== access.workspaceId) {
    return { error: 'Workspace access denied.' };
  }
  const validatedData = workflowSessionSchema.safeParse(rawData);

  if (!validatedData.success) {
    return { error: validatedData.error.issues[0].message };
  }

  const payload = validatedData.data;

  try {
    if (payload.existingSessionId) {
      await prisma.workflowSession.update({
        where: { id: payload.existingSessionId, workspaceId: access.workspaceId },
        data: {
          data: payload.data,
          status: 'DRAFT',
        },
      });
      return { success: true, id: payload.existingSessionId };
    } else {
      const session = await prisma.workflowSession.create({
        data: {
          workspaceId: payload.workspaceId,
          type: payload.type,
          data: payload.data,
          status: 'DRAFT',
          leadId: payload.leadId || null,
          dealId: payload.dealId || null,
        },
      });
      return { success: true, id: session.id };
    }
  } catch (error) {
    console.error('Failed to save workflow session:', error);
    return { error: 'Failed to save workflow state' };
  }
}

export async function submitWorkflowSession(sessionId: string) {
  const session = await getServerSession(authOptions);
  await requireWorkspaceRole(session, 'BROKER');
  if (!sessionId) return { error: 'Session ID required' };
  try {
    await prisma.workflowSession.update({
      where: { id: sessionId, workspaceId: (await requireWorkspaceAccess(session)).workspaceId },
      data: {
        status: 'SUBMITTED',
      },
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to submit workflow session:', error);
    return { error: 'Failed to submit workflow' };
  }
}

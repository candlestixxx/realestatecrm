'use server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceRole, requireWorkspaceAccess } from '@/lib/workspace-access';

import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { workflowSessionSchema } from '@/lib/validations/workflow';

export async function saveWorkflowSession(
  workspaceId: string,
  type: string,
  data: string,
  existingSessionId?: string | null,
  leadId?: string,
  dealId?: string,
) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  // Always use the workspaceId from the authenticated session
  const activeWorkspaceId = access.workspaceId;

  const rawData = {
    workspaceId: activeWorkspaceId,
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
      // Ensure we only update a session that belongs to the user's workspace
      const existing = await prisma.workflowSession.findFirst({
        where: {
          id: payload.existingSessionId,
          workspaceId: activeWorkspaceId,
        },
      });

      if (!existing) {
        return { error: 'Workflow session not found or access denied.' };
      }

      await prisma.workflowSession.update({
        where: { id: payload.existingSessionId, workspaceId: access.workspaceId },
        data: {
          data: payload.data,
          status: 'DRAFT',
        },
      });
      return { success: true, id: payload.existingSessionId };
    } else {
      const sessionRecord = await prisma.workflowSession.create({
        data: {
          workspaceId: activeWorkspaceId,
          userId: access.userId,
          type: payload.type,
          data: payload.data,
          status: 'DRAFT',
          leadId: payload.leadId || null,
          dealId: payload.dealId || null,
        },
      });
      return { success: true, id: sessionRecord.id };
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

  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);
  const activeWorkspaceId = access.workspaceId;

  try {
    // Ensure we only update a session that belongs to the user's workspace
    const existing = await prisma.workflowSession.findFirst({
      where: {
        id: sessionId,
        workspaceId: activeWorkspaceId,
      },
    });

    if (!existing) {
      return { error: 'Workflow session not found or access denied.' };
    }

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


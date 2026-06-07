'use server';

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

  const validatedData = workflowSessionSchema.safeParse(rawData);

  if (!validatedData.success) {
    return { error: validatedData.error.issues[0].message };
  }

  const payload = validatedData.data;

  try {
    if (payload.existingSessionId) {
      await prisma.workflowSession.update({
        where: { id: payload.existingSessionId },
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
  if (!sessionId) return { error: 'Session ID required' };
  try {
    await prisma.workflowSession.update({
      where: { id: sessionId },
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

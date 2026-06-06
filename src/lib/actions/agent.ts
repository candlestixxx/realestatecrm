'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { AppRole, isAtLeastRole } from '@/lib/permissions';

export async function createAgentWorkflowAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions.' };
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const trigger = formData.get('trigger') as string;
  const actions = formData.get('actions') as string; // JSON string

  if (!name || !trigger) {
    return { error: 'Name and trigger are required.' };
  }

  try {
    await prisma.agentWorkflow.create({
      data: {
        name,
        description,
        trigger,
        actions: actions || '[]',
        isActive: true,
        workspaceId: access.workspaceId,
      },
    });

    revalidatePath('/dashboard/agent-studio');
    return { success: true };
  } catch (error) {
    console.error('Failed to create agent workflow:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function toggleAgentWorkflowAction(workflowId: string, isActive: boolean) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions.' };
  }

  try {
    await prisma.agentWorkflow.update({
      where: { id: workflowId, workspaceId: access.workspaceId },
      data: { isActive },
    });

    revalidatePath('/dashboard/agent-studio');
    return { success: true };
  } catch (error) {
    console.error('Failed to toggle workflow status:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function triggerAgentRun(leadId: string, actionType: string, details: string) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  try {
    const log = await prisma.agentLog.create({
      data: {
        actionType,
        details,
        leadId,
        workspaceId: access.workspaceId,
      },
    });

    // Also record as a standard activity on the lead timeline
    await prisma.activity.create({
      data: {
        type: 'SYSTEM',
        content: `🤖 [AI AGENT ACTION] ${actionType}: ${details}`,
        workspaceId: access.workspaceId,
        leadId,
      },
    });

    revalidatePath(`/dashboard/leads/${leadId}`);
    return log;
  } catch (error) {
    console.error('Failed to log agent action:', error);
  }
}

export async function seedAgentWorkflowsIfEmpty(workspaceId: string) {
  const count = await prisma.agentWorkflow.count({ where: { workspaceId } });
  if (count === 0) {
    await prisma.agentWorkflow.createMany({
      data: [
        {
          name: 'Zillow Instant SMS Outreach',
          description: 'Instantly fires a greeting text when a lead is captured from Zillow.',
          trigger: 'NEW_LEAD_ZILLOW',
          actions: JSON.stringify([
            { type: 'SMS', template: 'Hi {{firstName}}, thanks for viewing {{address}} on Zillow! Do you want to schedule a showing?' }
          ]),
          workspaceId,
        },
        {
          name: 'Macomb Foreclosure Valuation Audit',
          description: 'Audits preforeclosure addresses using public record search alerts and notifies agent.',
          trigger: 'LEAD_PREFORECLOSURE',
          actions: JSON.stringify([
            { type: 'MLS_SEARCH_ALERT', frequency: 'INSTANT' },
            { type: 'TASK', title: 'Audit comparable sales value for foreclosing address.' }
          ]),
          workspaceId,
        }
      ]
    });
  }

  const logCount = await prisma.agentLog.count({ where: { workspaceId } });
  if (logCount === 0) {
    // Add default logs for show
    const firstLead = await prisma.lead.findFirst({ where: { workspaceId } });
    if (firstLead) {
      await prisma.agentLog.createMany({
        data: [
          {
            actionType: 'SMS',
            details: 'Auto-responded to Sarah Jenkins regarding MLS listing: "Hi Sarah, saw your inquiry..."',
            leadId: firstLead.id,
            workspaceId,
          },
          {
            actionType: 'EMAIL',
            details: 'Sent MLS Alert match summary email containing 3 new properties in Troy, MI.',
            leadId: firstLead.id,
            workspaceId,
          }
        ]
      });
    }
  }
}

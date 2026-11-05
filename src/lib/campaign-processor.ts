import prisma from './prisma';
import { sendMail } from './email-config';
import { addCampaignDelay as addDelay } from './campaign-schedule';

export type DelayUnit = 'SECOND' | 'MINUTE' | 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export interface CampaignStep {
  id: string;
  type: 'EMAIL' | 'SMS' | 'CALL' | 'TASK';
  delayValue: number;
  delayUnit: DelayUnit;
  subject?: string;
  content: string;
}

export interface CampaignSettings {
  scope?: string;
  leadType?: string;
  autoApplyTrigger?: string;
  autoApplyCriteria?: string;
  autoPauseOn?: string;
}

export interface CampaignStepsData {
  settings?: CampaignSettings;
  items?: CampaignStep[];
}

/**
 * Enrolls a lead in a campaign: deletes existing pending drip tasks,
 * parses campaign steps, schedules future tasks.
 */
export async function enrollLeadInCampaignSteps(
  leadId: string,
  campaignId: string | null,
  workspaceId: string,
  userId?: string | null
) {
  if (!campaignId) {
    await prisma.task.deleteMany({ where: { leadId, workspaceId, status: 'TODO', title: { startsWith: '[Drip:' } } });
    return;
  }
  // 2. Fetch the campaign
  const campaign = await prisma.smartPlan.findUnique({
    where: { id: campaignId, workspaceId },
  });

  if (!campaign || !campaign.steps) {
    return;
  }

  let stepsData: CampaignStepsData = {};
  try {
    const parsed = JSON.parse(campaign.steps);
    if (parsed.items) {
      stepsData = parsed;
    } else if (Array.isArray(parsed)) {
      // Legacy steps list fallback
      stepsData = { items: parsed };
    }
  } catch (e) {
    console.error('Failed to parse campaign steps:', e);
    return;
  }

  const stepsList = stepsData.items || [];
  if (stepsList.length === 0) {
    return;
  }

  // Build the full schedule before replacing pending tasks, so invalid dates cannot leave a partial schedule.
  let scheduledTime = new Date();
  const scheduledTasks = [];
  for (let idx = 0; idx < stepsList.length; idx++) {
    const step = stepsList[idx];
    scheduledTime = addDelay(scheduledTime, step.delayValue ?? (step as CampaignStep & { delayDays?: number }).delayDays ?? 0, step.delayUnit || 'DAY');

    const desc = step.type === 'EMAIL' 
      ? `Subject: ${step.subject || ''}\n\nContent:\n${step.content}`
      : step.content;

    scheduledTasks.push({
        title: `[Drip: ${campaign.name}] Step ${idx + 1}: ${step.type}`,
        description: desc,
        status: 'TODO',
        workspaceId,
        dueDate: scheduledTime,
        leadId,
        assignedToId: userId || null,
        triggerEmail: step.type === 'EMAIL',
        triggerSMS: step.type === 'SMS',
        triggerCall: step.type === 'CALL',
    });
  }

  await prisma.$transaction([
    prisma.task.deleteMany({ where: { leadId, workspaceId, status: 'TODO', title: { startsWith: '[Drip:' } } }),
    prisma.task.createMany({ data: scheduledTasks }),
  ]);

  // Process immediate due tasks
  await processDueCampaignTasks();
}

/**
 * Scans the database for due TODO drip tasks, executes them (email/SMS/call task alerts),
 * updates lead activity timeline, and sets status to DONE.
 */
export async function processDueCampaignTasks() {
  const now = new Date();

  // Find all due TODO drip tasks
  const dueTasks = await prisma.task.findMany({
    where: {
      status: 'TODO',
      dueDate: { lte: now },
      title: { startsWith: '[Drip:' },
      OR: [{ triggerEmail: true }, { triggerSMS: true }],
    },
    include: {
      lead: {
        include: {
          contact: true,
        },
      },
    },
  });

  if (dueTasks.length === 0) {
    return;
  }

  for (const task of dueTasks) {
    if (!task.lead) {
      // Clean up orphaned task or mark done
      await prisma.task.update({
        where: { id: task.id },
        data: { status: 'DONE' },
      });
      continue;
    }

    const lead = task.lead;
    const campaign = lead.smartPlanId ? await prisma.smartPlan.findFirst({
      where: { id: lead.smartPlanId, workspaceId: task.workspaceId, isActive: true },
    }) : null;
    if (!campaign || !task.title.startsWith(`[Drip: ${campaign.name}]`)) continue;
    const claimed = await prisma.task.updateMany({
      where: { id: task.id, status: 'TODO' }, data: { status: 'IN_PROGRESS' },
    });
    if (!claimed.count) continue;
    const campaignNameMatch = task.title.match(/\[Drip:\s*([^\]]+)\]/);
    const campaignName = campaignNameMatch ? campaignNameMatch[1] : 'Smart Plan';

    try {
      if (task.triggerEmail && lead.contact.email) {
        // Parse email subject and message
        const lines = task.description?.split('\n') || [];
        const subjectLine = lines.find((l) => l.startsWith('Subject:'));
        const subject = subjectLine ? subjectLine.replace('Subject:', '').trim() : 'Follow-up';

        const contentIndex = task.description?.indexOf('Content:\n') ?? -1;
        const message = contentIndex !== -1 
          ? task.description!.substring(contentIndex + 9) 
          : task.description || '';

        // Execute send
        const delivery = await sendMail({
          to: lead.contact.email,
          subject: subject,
          message: message,
        });
        if (!delivery.success || delivery.mode === 'SIMULATION') {
          throw new Error('Campaign email requires a configured live email provider.');
        }

        // Log Activity
        await prisma.activity.create({
          data: {
            type: 'EMAIL',
            content: `Campaign "${campaignName}" automated email sent to ${lead.contact.email}:\nSubject: ${subject}\n\n${message}`,
            workspaceId: task.workspaceId,
            userId: task.assignedToId,
            leadId: lead.id,
          },
        });
      } else if (task.triggerSMS && lead.contact.phone) {
        // Send SMS (simulation / real twilio fallback)
        const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
        const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
        const fromPhone = process.env.TWILIO_PHONE_NUMBER?.trim();
        const phone = lead.contact.phone;
        const message = task.description || '';

        if (accountSid && authToken && fromPhone) {
          try {
            const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
            const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
            const response = await fetch(twilioUrl, {
              method: 'POST',
              headers: {
                Authorization: `Basic ${basicAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                To: phone,
                From: fromPhone,
                Body: message,
              }).toString(),
            });
            if (!response.ok) throw new Error(`SMS provider returned ${response.status}`);
          } catch (e) {
            throw e;
          }
        } else {
          throw new Error('Campaign SMS requires configured Twilio credentials and a sending number.');
        }

        // Log Activity
        await prisma.activity.create({
          data: {
            type: 'SMS',
            content: `Campaign "${campaignName}" automated SMS sent to ${phone}:\n"${message}"`,
            workspaceId: task.workspaceId,
            userId: task.assignedToId,
            leadId: lead.id,
          },
        });
      } else {
        throw new Error('Campaign recipient is missing the required email address or phone number.');
      }

      // Mark task as completed successfully
      await prisma.task.update({
        where: { id: task.id },
        data: { status: 'DONE' },
      });
    } catch (err) {
      console.error(`Failed to process drip task ${task.id}:`, err);
      // Retain failed sends for operator review instead of silently recording delivery
      // or automatically retrying an ambiguous provider response.
      await prisma.task.update({ where: { id: task.id }, data: { status: 'ERROR' } });
    }
  }
}

/**
 * Inspects active campaigns in a workspace for auto-apply triggers
 * matching the given lead.
 */
export async function checkAndAutoEnrollLead(leadId: string, triggerEvent: 'LEAD_CREATED' | 'ASSIGNMENT_CHANGED' | 'SEGMENT_MATCHED', segmentId?: string) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { contact: true, segments: true },
    });

    if (!lead) return;

    // Fetch all active plans in this workspace
    const campaigns = await prisma.smartPlan.findMany({
      where: { workspaceId: lead.workspaceId, isActive: true },
    });

    for (const campaign of campaigns) {
      if (!campaign.steps) continue;
      
      let stepsData: CampaignStepsData = {};
      try {
        stepsData = JSON.parse(campaign.steps);
      } catch {
        continue;
      }

      const settings = stepsData.settings;
      if (!settings) continue;

      // 1. Verify Scope & Lead Type settings
      if (settings.leadType === 'BUYER' && lead.type !== 'BUYER') continue;
      if (settings.leadType === 'SELLER' && lead.type !== 'SELLER') continue;

      // 2. Verify Auto Apply Trigger matches
      if (settings.autoApplyTrigger === triggerEvent) {
        let isMatch = true;

        if (triggerEvent === 'SEGMENT_MATCHED' && segmentId && settings.autoApplyCriteria) {
          if (settings.autoApplyCriteria !== segmentId) {
            isMatch = false;
          }
        }

        if (isMatch) {
          // Enroll lead in campaign!
          await prisma.$transaction([
            prisma.lead.update({
              where: { id: leadId },
              data: { smartPlanId: campaign.id },
            }),
            prisma.activity.create({
              data: {
                type: 'SYSTEM',
                content: `Auto-enrolled in Smart Plan "${campaign.name}" via trigger: ${triggerEvent.replace('_', ' ')}.`,
                workspaceId: lead.workspaceId,
                leadId: leadId,
              },
            }),
          ]);

          await enrollLeadInCampaignSteps(leadId, campaign.id, lead.workspaceId, lead.userId);
          break; // Avoid enrolling in multiple plans simultaneously for now
        }
      }
    }
  } catch (error) {
    console.error('Error in auto-enrollment check:', error);
  }
}

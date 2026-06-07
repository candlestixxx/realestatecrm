import prisma from './prisma';
import { sendMail } from './email-config';

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

function addDelay(date: Date, value: number, unit: DelayUnit): Date {
  const newDate = new Date(date.getTime());
  switch (unit) {
    case 'SECOND':
      newDate.setSeconds(newDate.getSeconds() + value);
      break;
    case 'MINUTE':
      newDate.setMinutes(newDate.getMinutes() + value);
      break;
    case 'HOUR':
      newDate.setHours(newDate.getHours() + value);
      break;
    case 'DAY':
      newDate.setDate(newDate.getDate() + value);
      break;
    case 'WEEK':
      newDate.setDate(newDate.getDate() + value * 7);
      break;
    case 'MONTH':
      newDate.setMonth(newDate.getMonth() + value);
      break;
    case 'YEAR':
      newDate.setFullYear(newDate.getFullYear() + value);
      break;
  }
  return newDate;
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
  // 1. Delete all current TODO drip tasks for this lead
  await prisma.task.deleteMany({
    where: {
      leadId,
      status: 'TODO',
      title: {
        startsWith: '[Drip:',
      },
    },
  });

  if (!campaignId) {
    return;
  }

  // 2. Fetch the campaign
  const campaign = await prisma.smartPlan.findUnique({
    where: { id: campaignId },
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

  // 3. Add tasks sequentially
  let scheduledTime = new Date();
  for (let idx = 0; idx < stepsList.length; idx++) {
    const step = stepsList[idx];
    scheduledTime = addDelay(scheduledTime, step.delayValue || 0, step.delayUnit || 'DAY');

    const desc = step.type === 'EMAIL' 
      ? `Subject: ${step.subject || ''}\n\nContent:\n${step.content}`
      : step.content;

    await prisma.task.create({
      data: {
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
      },
    });
  }

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
        await sendMail({
          to: lead.contact.email,
          subject: subject,
          message: message,
        });

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
            await fetch(twilioUrl, {
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
          } catch (e) {
            console.error('Twilio campaign dispatch error:', e);
          }
        } else {
          console.log(`[Campaign SMS Simulation] Sent to ${phone}: ${message}`);
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
      } else if (task.triggerCall) {
        // Log Call task notification
        await prisma.activity.create({
          data: {
            type: 'SYSTEM',
            content: `Campaign "${campaignName}" Call Task alert: Please call ${lead.contact.firstName} ${lead.contact.lastName || ''} (${lead.contact.phone || 'no phone'}) regarding: "${task.description}"`,
            workspaceId: task.workspaceId,
            userId: task.assignedToId,
            leadId: lead.id,
          },
        });
      } else {
        // General task alert
        await prisma.activity.create({
          data: {
            type: 'SYSTEM',
            content: `Campaign "${campaignName}" task due: "${task.title.split(':').slice(2).join(':').trim() || task.description}"`,
            workspaceId: task.workspaceId,
            userId: task.assignedToId,
            leadId: lead.id,
          },
        });
      }

      // Mark task as completed successfully
      await prisma.task.update({
        where: { id: task.id },
        data: { status: 'DONE' },
      });
    } catch (err) {
      console.error(`Failed to process drip task ${task.id}:`, err);
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

import { Worker, Job } from 'bullmq'
import { campaignEngine } from '@/lib/campaigns/campaign-engine'
import { twilioService } from '@/lib/telephony/twilio-service'
import { emailService } from '@/lib/email/email-service'
import prisma from '@/lib/prisma'

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
}

// Campaign processing worker
const campaignWorker = new Worker('campaigns', async (job: Job) => {
  const { name, data } = job

  switch (name) {
    case 'process-campaign':
      await campaignEngine.processBatch(data.campaignId, data.batchIndex)
      break
    case 'execute-step':
      await campaignEngine.executeStep(data.campaignLeadId, data.stepIndex)
      break
  }
}, { connection, concurrency: 5 })

// Call worker
const callWorker = new Worker('calls', async (job: Job) => {
  const { name, data } = job
  // Handle call-specific jobs (voicemail, etc.)
  console.log(`Processing call job: ${name}`, data)
}, { connection, concurrency: 3 })

// Email worker
const emailWorker = new Worker('emails', async (job: Job) => {
  const { campaignLeadId, templateId, leadId } = job.data

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { contact: true }
  })

  if (!lead || !lead.contact?.email) {
      console.warn(`Cannot send email, missing lead or contact email for leadId: ${leadId}`)
      return;
  }

  const template = await prisma.emailTemplate.findUnique({
      where: { id: templateId }
  })

  if (!template) {
      console.warn(`Template not found: ${templateId}`);
      return;
  }

  const parsedBody = template.body.replace('{{firstName}}', lead.contact.firstName || 'there');

  await emailService.sendEmail({
    to: lead.contact.email,
    subject: template.subject,
    body: parsedBody,
    organizationId: template.organizationId,
    leadId: leadId
  });

}, { connection, concurrency: 10 })

// SMS worker
const smsWorker = new Worker('sms', async (job: Job) => {
  const { campaignLeadId, templateId, leadId } = job.data

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { contact: true }
  })

  if (!lead || !lead.contact?.phone) {
      console.warn(`Cannot send SMS, missing lead or contact phone for leadId: ${leadId}`)
      return;
  }

  const template = await prisma.smsTemplate.findUnique({
      where: { id: templateId }
  })

  if (!template) {
      console.warn(`Template not found: ${templateId}`);
      return;
  }

  const fromNumber = 'mockPhone123';

  if (!fromNumber) {
      console.warn(`Cannot send SMS, workspace has no configured phone number. Workspace ID: ${lead.workspaceId}`);
      return;
  }

  const parsedBody = template.body.replace('{{firstName}}', lead.contact.firstName || 'there');

  await twilioService.sendSms({
    to: lead.contact.phone,
    from: fromNumber,
    body: parsedBody,
    organizationId: template.organizationId,
    leadId: leadId
  });

}, { connection, concurrency: 10 })

campaignWorker.on('completed', (job) => {
  console.log(`Campaign job ${job.id} completed`)
})

campaignWorker.on('failed', (job, err) => {
  console.error(`Campaign job ${job?.id} failed:`, err)
})

console.log('Workers started successfully')

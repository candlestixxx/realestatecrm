import nodemailer from 'nodemailer'
import prisma from '@/lib/prisma'

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async sendEmail(params: {
    to: string;
    from?: string;
    subject: string;
    body: string;
    campaignId?: string;
    leadId?: string;
    organizationId: string;
  }): Promise<string> {
    if (!this.transporter) {
      console.warn("SMTP credentials not configured. Email blocked.");
      return "skipped_no_config";
    }

    const info = await this.transporter.sendMail({
      from: params.from || process.env.SMTP_FROM || 'noreply@voiceforge.ai',
      to: params.to,
      subject: params.subject,
      text: params.body,
    });

    await prisma.activity.create({
      data: {
        workspaceId: params.organizationId,
        type: 'EMAIL',
        content: `Sent Email: [${params.subject}] ${params.body.substring(0, 100)}...`,
        leadId: params.leadId || null
      }
    });

    return info.messageId;
  }
}

export const emailService = new EmailService()

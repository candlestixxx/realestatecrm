import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import nodemailer from 'nodemailer';

export type EmailConfig = {
  provider: 'SIMULATION' | 'AWS_SES' | 'SMTP' | 'RESEND';
  awsAccessKey?: string;
  awsSecretKey?: string;
  awsRegion?: string;
  fromEmail: string;
  smtpServer?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  resendApiKey?: string;
};

const settingsFile = path.join(process.cwd(), 'data', 'email-settings.json');

export async function getEmailConfig(): Promise<EmailConfig> {
  try {
    const raw = await readFile(settingsFile, 'utf8');
    return JSON.parse(raw) as EmailConfig;
  } catch {
    // Default fallback to environment variables or Simulation
    return {
      provider: process.env.AWS_ACCESS_KEY_ID ? 'AWS_SES' : 'SIMULATION',
      awsAccessKey: process.env.AWS_ACCESS_KEY_ID || '',
      awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      awsRegion: process.env.AWS_REGION || 'us-east-1',
      fromEmail: process.env.AWS_SES_FROM_EMAIL || 'info@excellegacy.com',
      resendApiKey: process.env.RESEND_API_KEY || '',
    };
  }
}

export async function saveEmailConfig(config: EmailConfig) {
  await mkdir(path.dirname(settingsFile), { recursive: true });
  await writeFile(settingsFile, JSON.stringify(config, null, 2), 'utf8');
}

export async function sendMail({
  to,
  subject,
  message,
}: {
  to: string;
  subject: string;
  message: string;
}) {
  const config = await getEmailConfig();

  if (config.provider === 'SIMULATION') {
    console.log(`[Email API] [SIMULATION] Sending email to ${to}: Subject: "${subject}", Content: "${message}"`);
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { success: true, mode: 'SIMULATION' };
  }

  if (config.provider === 'AWS_SES') {
    const accessKey = config.awsAccessKey || process.env.AWS_ACCESS_KEY_ID;
    const secretKey = config.awsSecretKey || process.env.AWS_SECRET_ACCESS_KEY;
    const region = config.awsRegion || process.env.AWS_REGION || 'us-east-1';

    if (!accessKey || !secretKey) {
      throw new Error('AWS SES Access Key or Secret Key is missing.');
    }

    const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
    const sesClient = new SESClient({
      region,
      credentials: {
        accessKeyId: accessKey.trim(),
        secretAccessKey: secretKey.trim(),
      },
    });

    const command = new SendEmailCommand({
      Destination: { ToAddresses: [to] },
      Message: {
        Body: { Text: { Data: message } },
        Subject: { Data: subject },
      },
      Source: `Excel Legacy Realty <${config.fromEmail}>`,
    });

    await sesClient.send(command);
    return { success: true, mode: 'AWS_SES' };
  }

  if (config.provider === 'RESEND') {
    const apiKey = config.resendApiKey || process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('Resend API Key is missing.');
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Excel Legacy Realty <${config.fromEmail}>`,
        to: [to],
        subject: subject,
        text: message,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Resend API failed: ${res.statusText} - ${errText}`);
    }

    return { success: true, mode: 'RESEND' };
  }

  if (config.provider === 'SMTP') {
    if (!config.smtpServer || !config.smtpUser || !config.smtpPass) {
      throw new Error('SMTP Configuration is missing credentials.');
    }

    const transporter = nodemailer.createTransport({
      host: config.smtpServer,
      port: config.smtpPort || 587,
      secure: config.smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: config.smtpUser.trim(),
        pass: config.smtpPass.trim(),
      },
    });

    await transporter.sendMail({
      from: `Excel Legacy Realty <${config.fromEmail}>`,
      to,
      subject,
      text: message,
    });

    return { success: true, mode: 'SMTP' };
  }

  throw new Error('Unknown email provider configured.');
}

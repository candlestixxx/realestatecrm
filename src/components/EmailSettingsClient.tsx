'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { saveEmailSettingsAction, sendTestEmailAction } from '@/lib/actions/email-settings';
import { EmailConfig } from '@/lib/email-config';

export default function EmailSettingsClient({ initialConfig }: { initialConfig: EmailConfig }) {
  const [provider, setProvider] = useState<EmailConfig['provider']>(initialConfig.provider);
  const [fromEmail, setFromEmail] = useState(initialConfig.fromEmail || 'info@excellegacy.com');

  // AWS SES State
  const [awsAccessKey, setAwsAccessKey] = useState(initialConfig.awsAccessKey || '');
  const [awsSecretKey, setAwsSecretKey] = useState(initialConfig.awsSecretKey || '');
  const [awsRegion, setAwsRegion] = useState(initialConfig.awsRegion || 'us-east-1');

  // SMTP State
  const [smtpServer, setSmtpServer] = useState(initialConfig.smtpServer || '');
  const [smtpPort, setSmtpPort] = useState(initialConfig.smtpPort || 587);
  const [smtpUser, setSmtpUser] = useState(initialConfig.smtpUser || '');
  const [smtpPass, setSmtpPass] = useState(initialConfig.smtpPass || '');

  // Resend State
  const [resendApiKey, setResendApiKey] = useState(initialConfig.resendApiKey || '');

  // Test Email State
  const [testEmail, setTestEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await saveEmailSettingsAction({
        provider,
        fromEmail,
        awsAccessKey,
        awsSecretKey,
        awsRegion,
        smtpServer,
        smtpPort,
        smtpUser,
        smtpPass,
        resendApiKey,
      });

      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success('Email settings updated successfully!');
      }
    } catch {
      toast.error('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please input a recipient email address.');
      return;
    }

    setIsTesting(true);
    const loadingToast = toast.loading(`Sending test email to ${testEmail}...`);

    try {
      const res = await sendTestEmailAction(testEmail);
      toast.dismiss(loadingToast);

      if (res && res.error) {
        toast.error(`Test failed: ${res.error}`);
      } else {
        toast.success(`Success! Email sent via ${res.mode}`);
      }
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(`Network error: ${err.message || err}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email System Integration</h1>
        <p className="text-muted-foreground">Configure SMTP, Amazon SES, or Resend to send real marketing campaigns and triggers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form Panel */}
        <form onSubmit={handleSave} className="lg:col-span-2 bg-background border border-border rounded-xl p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-bold pb-2 border-b border-border/50">Provider Selection</h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Outgoing Email Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as any)}
                className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary h-[38px]"
              >
                <option value="SIMULATION">💻 Simulation Mode (Dev Logs Only)</option>
                <option value="SMTP">📧 Custom SMTP Server (Outlook, Gmail, Yahoo)</option>
                <option value="AWS_SES">☁️ Amazon SES (Highly Recommended for Teams)</option>
                <option value="RESEND">🚀 Resend API (Developer-friendly)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sender Email (From address) *</label>
              <input
                required
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="info@excellegacy.com"
                className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
              <p className="text-[10px] text-muted-foreground italic">Note: In SMTP, this should match your mail username. In SES, this email address must be verified.</p>
            </div>
          </div>

          {/* Amazon SES settings fields */}
          {provider === 'AWS_SES' && (
            <div className="space-y-4 pt-4 border-t border-border/40">
              <h3 className="text-sm font-bold text-foreground/80">Amazon SES Credentials</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">AWS Access Key ID</label>
                  <input
                    type="text"
                    value={awsAccessKey}
                    onChange={(e) => setAwsAccessKey(e.target.value)}
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">AWS Secret Access Key</label>
                  <input
                    type="password"
                    value={awsSecretKey}
                    onChange={(e) => setAwsSecretKey(e.target.value)}
                    placeholder="••••••••••••••••••••"
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">AWS Region</label>
                <input
                  type="text"
                  value={awsRegion}
                  onChange={(e) => setAwsRegion(e.target.value)}
                  placeholder="us-east-1"
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* SMTP settings fields */}
          {provider === 'SMTP' && (
            <div className="space-y-4 pt-4 border-t border-border/40">
              <h3 className="text-sm font-bold text-foreground/80">Custom SMTP Settings</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">SMTP Server Host</label>
                  <input
                    type="text"
                    value={smtpServer}
                    onChange={(e) => setSmtpServer(e.target.value)}
                    placeholder="smtp.mailtrap.io"
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div className="col-span-1 space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Port</label>
                  <input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    placeholder="587"
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">SMTP Username</label>
                  <input
                    type="text"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="your-email@outlook.com"
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">SMTP Password / App Secret</label>
                  <input
                    type="password"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder="••••••••••••••••••••"
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Resend settings fields */}
          {provider === 'RESEND' && (
            <div className="space-y-4 pt-4 border-t border-border/40">
              <h3 className="text-sm font-bold text-foreground/80">Resend API</h3>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Resend API Key</label>
                <input
                  type="password"
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                  placeholder="re_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-border/50 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>

        {/* Right Info & Test Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Test Dispatch Widget */}
          <div className="bg-background border border-border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm uppercase text-muted-foreground pb-2 border-b border-border/50">Test Integration</h3>
            <p className="text-xs text-muted-foreground">Send a real verification email to confirm SMTP or SES connectivity.</p>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="e.g. your-email@gmail.com"
              className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
            />
            <button
              type="button"
              disabled={isTesting || !testEmail}
              onClick={handleTestEmail}
              className="w-full py-2 bg-secondary text-secondary-foreground text-xs font-bold rounded-lg hover:bg-secondary/90 transition-colors"
            >
              {isTesting ? 'Sending Test...' : '📬 Send Test Email'}
            </button>
          </div>

          {/* Guide Section */}
          <div className="bg-muted/10 border border-border rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-sm uppercase text-muted-foreground">Quick Setup Guide</h3>
            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <div>
                <p className="font-bold text-foreground mb-1">Option A: SMTP (Outlook/Gmail)</p>
                <p>1. Go to your account settings and generate an &quot;App Password&quot;.</p>
                <p>2. Put SMTP Server as `smtp.gmail.com` (Gmail) or `smtp.office365.com` (Outlook).</p>
                <p>3. Use Port `587` with your email and generated app password.</p>
              </div>
              <div className="pt-2 border-t border-border/50">
                <p className="font-bold text-foreground mb-1">Option B: Amazon SES</p>
                <p>1. Generate an IAM User in AWS with `AmazonSESFullAccess` permissions.</p>
                <p>2. Obtain the Access/Secret Keys and input them here.</p>
                <p>3. Make sure to verify your From Email domain in the AWS SES console first.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

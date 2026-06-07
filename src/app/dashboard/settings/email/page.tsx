import { getEmailConfig } from '@/lib/email-config';
import EmailSettingsClient from '@/components/EmailSettingsClient';

export default async function EmailSettingsPage() {
  const config = await getEmailConfig();

  return (
    <div className="max-w-6xl mx-auto">
      <EmailSettingsClient initialConfig={config} />
    </div>
  );
}
export const revalidate = 0;

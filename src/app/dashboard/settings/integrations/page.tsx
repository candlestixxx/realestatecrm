import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MyPlusLeadsSettingsForm } from '@/components/MyPlusLeadsSettingsForm';
import { WebhooksForm } from './WebhooksForm';

export const metadata: Metadata = {
  title: 'Integrations - Settings',
};

export default async function IntegrationsPage() {
  const session = await getServerSession(authOptions);
  const workspaceId = session?.user?.workspaces?.[0]?.workspaceId;

  let integrationData = null;

  if (workspaceId) {
    integrationData = await prisma.myPlusLeadsIntegration.findUnique({
      where: { workspaceId },
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6 select-none">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Integrations & Lead Sources</h1>
          <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded font-bold uppercase tracking-wide">
            Automations
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Connect MyPlusLeads and link your real estate portal profiles to automatically intake leads.
        </p>
      </div>

      {workspaceId ? (
        <MyPlusLeadsSettingsForm initialData={integrationData} workspaceId={workspaceId} />
      ) : (
        <p className="text-muted-foreground">No active workspace found to configure integrations.</p>
      )}

      <WebhooksForm />
    </div>
  );
}

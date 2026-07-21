import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import IntegrationCenterClient from '@/components/IntegrationCenterClient';

export const metadata: Metadata = {
  title: 'Integration Center - Settings',
};

export default async function IntegrationsPage() {
  const session = await getServerSession(authOptions);
  // Get active workspace ID safely
  const workspaceId = session?.user?.workspaceId || 'default';

  let integrationData = null;

  if (workspaceId && workspaceId !== 'default') {
    integrationData = await prisma.myPlusLeadsIntegration.findFirst({
      where: { workspaceId },
    });
  }

  return (
    <IntegrationCenterClient 
      initialData={integrationData} 
      workspaceId={workspaceId} 
    />
  );
}

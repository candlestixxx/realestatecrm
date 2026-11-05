import { PrismaClient } from '@prisma/client';
import { DEFAULT_CAMPAIGNS } from '../src/lib/default-campaigns.ts';

const prisma = new PrismaClient();
try {
  const workspaces = await prisma.workspace.findMany({ select: { id: true } });
  for (const workspace of workspaces) {
    for (const template of DEFAULT_CAMPAIGNS) {
      await prisma.smartPlan.upsert({
        where: { id: `default-${workspace.id}-${template.key}` }, update: {},
        create: {
          id: `default-${workspace.id}-${template.key}`, workspaceId: workspace.id,
          name: template.name, description: template.description, scope: 'COMPANY',
          leadType: template.leadType, duration: template.duration, isActive: true, autoApply: false,
          steps: JSON.stringify({ settings: { scope: 'COMPANY', leadType: template.leadType, autoApplyTrigger: 'NONE', autoApplyCriteria: '', autoPauseOn: 'NONE' }, items: template.steps }),
        },
      });
    }
  }
  console.log(`Default buyer and seller plans available in ${workspaces.length} workspaces.`);
} finally {
  await prisma.$disconnect();
}

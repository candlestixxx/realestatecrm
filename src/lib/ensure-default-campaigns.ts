import prisma from './prisma';
import { DEFAULT_CAMPAIGNS } from './default-campaigns';

export async function ensureDefaultCampaigns(workspaceId: string) {
  // Stable ids make concurrent first visits safe and preserve edits on later visits.
  for (const template of DEFAULT_CAMPAIGNS) {
    await prisma.smartPlan.upsert({
      where: { id: `default-${workspaceId}-${template.key}` },
      update: {},
      create: {
        id: `default-${workspaceId}-${template.key}`,
        workspaceId, name: template.name, description: template.description,
        scope: 'COMPANY', leadType: template.leadType, duration: template.duration,
        isActive: true, autoApply: false,
        steps: JSON.stringify({
          settings: { scope: 'COMPANY', leadType: template.leadType, autoApplyTrigger: 'NONE', autoApplyCriteria: '', autoPauseOn: 'NONE' },
          items: template.steps,
        }),
      },
    });
  }
}

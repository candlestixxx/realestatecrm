import { processDueCampaignTasks } from './campaign-processor';

const state = globalThis as typeof globalThis & { campaignTimer?: ReturnType<typeof setInterval> };

export function startCampaignScheduler() {
  if (state.campaignTimer) return;
  // Independent of dashboard traffic. Database claims prevent overlapping dispatch.
  state.campaignTimer = setInterval(() => {
    void processDueCampaignTasks().catch(error => console.error('Campaign scheduler failed:', error));
  }, 60000);
  state.campaignTimer.unref();
}

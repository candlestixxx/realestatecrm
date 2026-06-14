// ─── Integration Index ────────────────────────────────────────────────────────
//
// Central export for all external integration services.
// MyPlus Leads ↔ Lofty CRM sync pipeline.

export {
  addToSyncQueue,
  addLeadsToSyncQueue,
  getSyncQueue,
  getSyncQueueItem,
  getNextQueued,
  getQueueStats,
  updateSyncItem,
  skipSyncItem,
  markSynced,
  markFailed,
} from './sync-queue';

export type { SyncQueueItem, SyncStatus, SyncQueueFile } from './sync-queue';

export {
  buildMyPlusSearchUrl,
  buildMyPlusLeadUrl,
  buildSearchQuery,
  buildSyncPlan,
  MYPLUS_PORTAL_BASE,
} from './myplus';

export type { MyPlusLeadSearchResult } from './myplus';

export {
  searchLoftyContact,
  searchLoftyContactStrict,
  getLoftyContact,
  verifyLeadInLofty,
  addTagsToLoftyContact,
  LOFTY_API_BASE,
} from './lofty';

export type { LoftyContact, LoftySyncResult } from './lofty';

export {
  buildIntegrationReadiness,
  buildMyPlusChimeChecklist,
} from './sync-workflow';

export type {
  IntegrationReadiness,
  IntegrationReadinessInput,
  MyPlusChecklistStep,
} from './sync-workflow';

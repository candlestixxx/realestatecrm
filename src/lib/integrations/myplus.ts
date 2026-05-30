// ─── MyPlus Leads API Service ────────────────────────────────────────────────
//
// MyPlus Leads has a native Lofty integration inside the portal.
// The workflow for one-at-a-time sync:
//   1. Search for a lead by name in MyPlus portal
//   2. Open the lead detail
//   3. Trigger the Lofty sync from the lead page
//
// This service provides:
//   - Portal URL construction for quick navigation
//   - Search query building
//   - Sync trigger (once we have portal session/automation)

const MYPLUS_PORTAL_BASE = 'https://portal.myplusleads.com';

export type MyPlusLeadSearchResult = {
  portalUrl: string;
  searchUrl: string;
  name: string;
};

/**
 * Build the MyPlus portal search URL for a given lead name.
 * The portal search is at: /leads?search=<name>
 */
export function buildMyPlusSearchUrl(name: string): string {
  const encoded = encodeURIComponent(name);
  return `${MYPLUS_PORTAL_BASE}/leads?search=${encoded}`;
}

/**
 * Build the direct portal URL for a specific lead if we know its ID.
 */
export function buildMyPlusLeadUrl(leadId: string): string {
  return `${MYPLUS_PORTAL_BASE}/leads/${leadId}`;
}

/**
 * Construct the search query string for finding a lead in MyPlus.
 * Uses "firstName lastName" format for best match.
 */
export function buildSearchQuery(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

/**
 * For the one-at-a-time sync workflow:
 *   1. Operator opens MyPlus portal (or we navigate via browser automation)
 *   2. Search for the lead by name
 *   3. Open the lead detail page
 *   4. Click "Sync to Lofty" (or the Chime integration button)
 *   5. Confirm sync
 *   6. Verify lead appears in Lofty
 *
 * This function builds the portal navigation plan for a single lead.
 */
export function buildSyncPlan(firstName: string, lastName: string): {
  step1_search: string;
  step2_action: string;
  step3_verify: string;
} {
  const searchUrl = buildMyPlusSearchUrl(`${firstName} ${lastName}`);
  return {
    step1_search: `Open ${searchUrl} and find "${firstName} ${lastName}"`,
    step2_action:
      'Open the lead, save the contact note/disposition, then use Data Integration Logs / provider surface and choose Lofty (not Zapier). Confirm the sync modal if prompted.',
    step3_verify:
      'Verify the MyPlus history shows "Lofty - Synchronized", then confirm the lead appears in Lofty CRM under the correct agent.',
  };
}

export { MYPLUS_PORTAL_BASE };

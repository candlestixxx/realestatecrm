// ─── Lofty CRM API Service ───────────────────────────────────────────────────
//
// Lofty (formerly Chime) has a REST API for contact management.
// API key is found in Settings at the bottom of the page.
// Docs: https://developers.lofty.com
//
// Used for:
//   - Verifying a lead synced from MyPlus actually landed in Lofty
//   - Enriching the lead with tags, pipeline stage, assignment
//   - Future: direct contact creation as a fallback path

const LOFTY_API_BASE = 'https://api.lofty.com/v1.0';

export type LoftyContact = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  tags: string[];
  source: string;
  agentId: string | null;
  createdAt: string;
};

export type LoftySyncResult = {
  success: boolean;
  contactId: string | null;
  error: string | null;
};

type LoftyApiEnvelope = {
  code?: number;
  message?: string;
  data?: unknown;
};

function firstString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value;
  if (Array.isArray(value)) {
    const first = value[0];
    if (typeof first === 'string' && first.trim()) return first;
    if (first && typeof first === 'object') {
      const record = first as Record<string, unknown>;
      return firstString(record.value ?? record.number ?? record.email ?? record.phone);
    }
  }
  return null;
}

/**
 * Normalize Lofty's v1.0 lead shapes into the contact shape the sync queue uses.
 * Lofty can return camelCase, snake_case, or nested phone/email arrays depending
 * on endpoint/account settings, so keep the parser tolerant but deterministic.
 */
export function mapLoftyLead(lead: Record<string, unknown>): LoftyContact {
  const id = lead.id ?? lead.leadId ?? lead.lead_id ?? '';
  const tags = lead.tags ?? lead.tagList ?? lead.tag_list ?? [];

  return {
    id: String(id),
    firstName: String(lead.firstName ?? lead.first_name ?? ''),
    lastName: String(lead.lastName ?? lead.last_name ?? ''),
    email: firstString(lead.email ?? lead.primaryEmail ?? lead.primary_email ?? lead.emails),
    phone: firstString(lead.phone ?? lead.primaryPhone ?? lead.primary_phone ?? lead.phones),
    tags: Array.isArray(tags) ? tags.map(String) : [],
    source: String(lead.source ?? 'MyPlus'),
    agentId: lead.agentId || lead.agent_id ? String(lead.agentId ?? lead.agent_id) : null,
    createdAt: String(lead.createdAt ?? lead.created_at ?? ''),
  };
}

export function parseLoftyLeadSearchResponse(body: LoftyApiEnvelope): LoftyContact[] {
  if (typeof body.code === 'number' && body.code !== 0) {
    throw new Error(`Lofty API error: ${body.message ?? `code ${body.code}`}`);
  }

  const data = body.data as Record<string, unknown> | unknown[] | undefined;
  const leads = Array.isArray(data)
    ? data
    : Array.isArray(data?.leads)
      ? data.leads
      : Array.isArray(data?.items)
        ? data.items
        : [];

  return leads.map((lead) => mapLoftyLead(lead as Record<string, unknown>));
}

/**
 * Headers for Lofty API calls.
 */
function getHeaders(apiKey: string) {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Search for a contact in Lofty by name or email.
 * Used to verify MyPlus sync landed the lead correctly.
 *
 * Lofty API response format: { code: 0, message: "success", data: { ... } }
 */
export async function searchLoftyContact(
  apiKey: string,
  query: string,
): Promise<LoftyContact[]> {
  try {
    return await searchLoftyContactStrict(apiKey, query);
  } catch (error) {
    console.error('Lofty contact search failed:', error);
    return [];
  }
}

export async function searchLoftyContactStrict(
  apiKey: string,
  query: string,
): Promise<LoftyContact[]> {
  const url = `${LOFTY_API_BASE}/leads?keyword=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(apiKey),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(`Lofty API error: ${body.message ?? response.statusText}`);
  }

  return parseLoftyLeadSearchResponse(body);
}

/**
 * Get a specific contact from Lofty by ID.
 */
export async function getLoftyContact(
  apiKey: string,
  contactId: string,
): Promise<LoftyContact | null> {
  const url = `${LOFTY_API_BASE}/leads/${contactId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(apiKey),
    });

    const body = await response.json();

    if (!response.ok || (typeof body.code === 'number' && body.code !== 0)) {
      throw new Error(`Lofty API error: ${body.message ?? `${response.status} ${response.statusText}`}`);
    }

    const lead = body.data?.lead ?? body.data ?? body.lead ?? null;
    return lead ? mapLoftyLead(lead) : null;
  } catch (error) {
    console.error('Lofty contact fetch failed:', error);
    return null;
  }
}

/**
 * Verify that a lead exists in Lofty after MyPlus sync.
 * Searches by name and checks for a match.
 */
export async function verifyLeadInLofty(
  apiKey: string,
  firstName: string,
  lastName: string,
): Promise<{ found: boolean; contactId: string | null }> {
  const query = `${firstName} ${lastName}`;
  const results = await searchLoftyContact(apiKey, query);

  const exactMatch = results.find(
    (c) =>
      c.firstName.toLowerCase() === firstName.toLowerCase() &&
      c.lastName.toLowerCase() === lastName.toLowerCase(),
  );

  return {
    found: !!exactMatch,
    contactId: exactMatch?.id ?? null,
  };
}

/**
 * Add tags to a Lofty contact.
 * Useful for marking preforeclosure leads after sync.
 */
export async function addTagsToLoftyContact(
  apiKey: string,
  contactId: string,
  tags: string[],
): Promise<boolean> {
  const url = `${LOFTY_API_BASE}/contacts/${contactId}/tags`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify({ tags }),
    });

    return response.ok;
  } catch (error) {
    console.error('Lofty tag update failed:', error);
    return false;
  }
}

export { LOFTY_API_BASE };

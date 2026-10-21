export type CrmRecordView = {
  id: string;
  displayName: string;
  subtitle: string | null;
  primaryAddress: string | null;
  status: string;
  sourceSystem: string | null;
  sourceRecordId: string | null;
  payload: Record<string, string>;
  recordType?: string;
  workflowType?: string | null;
};

// Fallback defaults are EMPTY: when no CRM record supplies real data, the
// form must be filled by the agent — never pre-populated with fabricated
// names/addresses/prices that would then be saved as real records.
const offerFallbackDefaults = {
  buyerName: '',
  propertyAddress: '',
  offerPrice: '',
  earnestMoney: '',
  closingDate: '',
  financingType: '',
  contingencies: '',
  inclusions: '',
  agentNotes: '',
};

const listingFallbackDefaults = {
  sellerName: '',
  propertyAddress: '',
  listingPrice: '',
  beds: '',
  baths: '',
  squareFeet: '',
  lotSize: '',
  propertyType: '',
  status: 'Draft',
  remarks: '',
  showingInstructions: '',
};

export function buildOfferDefaultsFromView(record: CrmRecordView | null): Record<string, string> {
  const payload = record?.payload ?? {};
  return {
    buyerName: payload.buyerName ?? offerFallbackDefaults.buyerName,
    propertyAddress: payload.propertyAddress ?? offerFallbackDefaults.propertyAddress,
    offerPrice: payload.offerPrice ?? offerFallbackDefaults.offerPrice,
    earnestMoney: payload.earnestMoney ?? offerFallbackDefaults.earnestMoney,
    closingDate: payload.closingDate ?? offerFallbackDefaults.closingDate,
    financingType: payload.financingType ?? offerFallbackDefaults.financingType,
    contingencies: payload.contingencies ?? offerFallbackDefaults.contingencies,
    inclusions: payload.inclusions ?? offerFallbackDefaults.inclusions,
    agentNotes: payload.agentNotes ?? offerFallbackDefaults.agentNotes,
  };
}

export function buildListingDefaultsFromView(record: CrmRecordView | null): Record<string, string> {
  const payload = record?.payload ?? {};
  return {
    sellerName: payload.sellerName ?? listingFallbackDefaults.sellerName,
    propertyAddress: payload.propertyAddress ?? listingFallbackDefaults.propertyAddress,
    listingPrice: payload.listingPrice ?? listingFallbackDefaults.listingPrice,
    beds: payload.beds ?? listingFallbackDefaults.beds,
    baths: payload.baths ?? listingFallbackDefaults.baths,
    squareFeet: payload.squareFeet ?? listingFallbackDefaults.squareFeet,
    lotSize: payload.lotSize ?? listingFallbackDefaults.lotSize,
    propertyType: payload.propertyType ?? listingFallbackDefaults.propertyType,
    status: payload.status ?? listingFallbackDefaults.status,
    remarks: payload.remarks ?? listingFallbackDefaults.remarks,
    showingInstructions: payload.showingInstructions ?? listingFallbackDefaults.showingInstructions,
  };
}

export function buildOfferSummaryItemsFromView(record: CrmRecordView | null) {
  const payload = record?.payload ?? {};
  return [
    { label: 'Buyer', value: payload.buyerName || 'Not provided', source: 'CRM' },
    { label: 'Property', value: payload.propertyAddress || 'Not provided', source: 'CRM' },
    { label: 'Deal stage', value: record?.status ?? 'Offer drafting', source: 'Workflow' },
    {
      label: 'Source provenance',
      value: record?.sourceSystem ?? 'No source record linked',
      source: record?.sourceRecordId ? 'Tracked' : 'Untracked',
      accent: true,
    },
  ];
}

export function buildListingSummaryItemsFromView(record: CrmRecordView | null) {
  const payload = record?.payload ?? {};
  return [
    { label: 'Seller', value: payload.sellerName || 'Not provided', source: 'CRM' },
    { label: 'Listing', value: payload.propertyAddress || 'Not provided', source: 'CRM' },
    { label: 'Agreement', value: record?.status ?? 'Draft', source: 'Docs' },
    {
      label: 'Source provenance',
      value: record?.sourceSystem ?? 'No source record linked',
      source: record?.sourceRecordId ? 'Tracked' : 'Untracked',
      accent: true,
    },
  ];
}

export function buildOfferActivitySeedFromView(record: CrmRecordView | null) {
  return [
    {
      title: 'Loaded from live CRM record',
      detail: record
        ? `Offer workflow is opening from ${record.displayName}.`
        : 'Open offer workflow started without a linked CRM record — enter details manually.',
      timestamp: 'Now',
    },
    {
      title: 'Review gate ready',
      detail: 'Broker/team lead approval can be requested from this screen.',
      timestamp: 'Earlier',
    },
  ];
}

export function buildListingActivitySeedFromView(record: CrmRecordView | null) {
  return [
    {
      title: 'Loaded from live CRM record',
      detail: record
        ? `Listing workflow is opening from ${record.displayName}.`
        : 'Listing workflow started without a linked CRM record — enter details manually.',
      timestamp: 'Now',
    },
    {
      title: 'Validation rail ready',
      detail: 'The screen is waiting for the agent to review or publish the draft listing.',
      timestamp: 'Earlier',
    },
  ];
}

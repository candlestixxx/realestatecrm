import { WorkflowStudio } from '@/components/workflows/workflow-studio';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import {
  buildListingActivitySeed,
  buildListingDefaults,
  buildListingSummaryItems,
  getCrmRecord,
} from '@/lib/crm-records';
import { requireWorkspaceAccess } from '@/lib/workspace-access';

function extractRecordId(searchParams: unknown) {
  if (!searchParams) return null;

  const params = searchParams as Record<string, unknown> & {
    get?: (name: string) => string | null;
  };

  if (typeof params.get === 'function') {
    return params.get('recordId')?.trim() || null;
  }

  const candidate = params.recordId;
  if (Array.isArray(candidate)) {
    return candidate[0]?.trim() || null;
  }

  if (typeof candidate === 'string') {
    return candidate.trim() || null;
  }

  return null;
}

const listingSections = [
  {
    title: 'Property and pricing',
    description:
      'Prefill the core property record and keep the values visible while the agent edits the listing.',
    fields: [
      { key: 'sellerName', label: 'Seller name', type: 'text', required: true, source: 'CRM' },
      { key: 'propertyAddress', label: 'Property address', type: 'text', required: true, source: 'MLS' },
      { key: 'listingPrice', label: 'List price', type: 'number', required: true, source: 'Draft' },
      {
        key: 'propertyType',
        label: 'Property type',
        type: 'select',
        required: true,
        options: ['Single Family', 'Condo', 'Townhouse', 'Multi-Family', 'Land', 'Commercial'],
        source: 'MLS',
      },
      { key: 'beds', label: 'Beds', type: 'number', required: true, source: 'Approved source' },
      { key: 'baths', label: 'Baths', type: 'number', required: true, source: 'Approved source' },
      { key: 'squareFeet', label: 'Square feet', type: 'number', required: true, source: 'Approved source' },
      { key: 'lotSize', label: 'Lot size (acres)', type: 'number', source: 'Parcel' },
      {
        key: 'status',
        label: 'Listing status',
        type: 'select',
        required: true,
        options: ['Draft', 'Coming Soon', 'Active', 'Pending', 'Sold'],
        source: 'Workflow',
      },
    ],
  },
  {
    title: 'Remarks and showing prep',
    description:
      'Keep the description, media expectations, and showing notes in one visible editing area.',
    fields: [
      {
        key: 'remarks',
        label: 'Public remarks',
        type: 'textarea',
        required: true,
        placeholder: 'Write an appealing listing summary...',
        source: 'Agent',
      },
      {
        key: 'showingInstructions',
        label: 'Showing instructions',
        type: 'textarea',
        placeholder: 'Add lockbox, notice, and access instructions...',
        source: 'Agent',
      },
    ],
  },
] as const;

const listingActions = [
  { id: 'save', label: 'Save Draft', tone: 'ghost' },
  { id: 'media', label: 'Upload Photos', tone: 'ghost' },
  { id: 'docs', label: 'Attach Documents', tone: 'ghost' },
  { id: 'preview', label: 'Preview Listing', tone: 'secondary' },
  { id: 'submit', label: 'Submit to MLS', tone: 'primary' },
] as const;

type ListingEntryPageProps = {
  searchParams?: unknown;
};

export default async function ListingEntryPage({ searchParams }: ListingEntryPageProps) {
  const recordId = extractRecordId(await Promise.resolve(searchParams));
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);
  const record = recordId ? await getCrmRecord(recordId, { workspaceSlug: access.workspaceSlug }) : null;
  const workflowId = recordId ? `listing-entry:${recordId}` : 'listing-entry';
  const displayRecord = record?.id === recordId ? record : null;
  const subtitle = displayRecord
    ? `Opening from live CRM record ${displayRecord.displayName} with editable property data, backend draft persistence, and mobile-first controls.`
    : 'Interactive listing entry with editable property data, backend draft persistence, live CRM records, validation, and mobile-first controls.';

  return (
    <WorkflowStudio
      key={workflowId}
      eyebrow="Listing workflow map"
      title="Listing Entry Screen"
      routeLabel={displayRecord ? `/dashboard → ${displayRecord.displayName}` : '/workflows/listing-entry'}
      subtitle={subtitle}
      workflowId={workflowId}
      storageKey={`workflow-listing-entry${recordId ? `:${recordId}` : ''}`}
      summaryItems={buildListingSummaryItems(displayRecord)}
      workspaceId={access.workspaceSlug}
      existingSessionId={recordId ?? undefined}
      sections={listingSections as unknown as Parameters<typeof WorkflowStudio>[0]['sections']}
      actions={listingActions as unknown as Parameters<typeof WorkflowStudio>[0]['actions']}
      validationTitle="Listing validation"
      validationNotes={[
        'Missing or conflicting fields are surfaced in the same screen so they can be fixed before submission.',
        'Source provenance stays visible next to the property data to support review and compliance.',
        'Save Draft stores the form locally so the mobile app can recover after backgrounding or disconnects.',
      ]}
      mobileNotes={[
        'Use the sticky bottom action bar to save, preview, or submit on mobile.',
        'The screen collapses into a single-column editing layout with visible source context.',
        'Review the draft package before submitting it to MLS.',
      ]}
      provenanceTitle="Source provenance"
      provenanceNotes={[
        'Listing data is loaded from the live CRM/dashboard record when available.',
        'Property facts should remain traceable back to the approved source system.',
        'Human review is required before publish/submit actions are finalized.',
      ]}
      defaultValues={buildListingDefaults(displayRecord)}
      activitySeed={buildListingActivitySeed(displayRecord)}
    />
  );
}

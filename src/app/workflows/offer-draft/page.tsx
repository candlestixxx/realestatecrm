import { WorkflowStudio } from '@/components/workflows/workflow-studio';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import {
  buildOfferActivitySeed,
  buildOfferDefaults,
  buildOfferSummaryItems,
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

const offerSections = [
  {
    title: 'Core offer details',
    description:
      'Edit the record with the offer terms that should flow into the package and CRM timeline.',
    fields: [
      { key: 'buyerName', label: 'Buyer name', type: 'text', required: true, source: 'CRM' },
      { key: 'propertyAddress', label: 'Property address', type: 'text', required: true, source: 'MLS' },
      { key: 'offerPrice', label: 'Offer price', type: 'number', required: true, source: 'Draft' },
      { key: 'earnestMoney', label: 'Earnest money', type: 'number', source: 'Draft' },
    ],
  },
  {
    title: 'Terms and supporting context',
    description:
      'Capture the conditions, timeline, and notes that help the broker review the offer quickly.',
    fields: [
      {
        key: 'closingDate',
        label: 'Target closing date',
        type: 'date',
        required: true,
        source: 'Calendar',
      },
      {
        key: 'financingType',
        label: 'Financing type',
        type: 'select',
        required: true,
        options: ['Conventional', 'FHA', 'VA', 'Cash', 'USDA', 'Other'],
        source: 'Buyer',
      },
      {
        key: 'contingencies',
        label: 'Contingencies',
        type: 'textarea',
        placeholder: 'Inspection, appraisal, financing...',
        source: 'Agent',
      },
      {
        key: 'inclusions',
        label: 'Inclusions / exclusions',
        type: 'textarea',
        placeholder: 'What stays with the property?',
        source: 'MLS',
      },
      {
        key: 'agentNotes',
        label: 'Comparable notes / agent notes',
        type: 'textarea',
        placeholder: 'Add supporting notes for pricing or strategy...',
        source: 'Agent',
      },
    ],
  },
] as const;

const offerActions = [
  { id: 'save', label: 'Save Draft', tone: 'ghost' },
  { id: 'docs', label: 'Attach Supporting Docs', tone: 'ghost' },
  { id: 'package', label: 'Generate Package', tone: 'secondary' },
  { id: 'review', label: 'Request Review', tone: 'secondary' },
  { id: 'signature', label: 'Send for Signature', tone: 'primary' },
] as const;

type OfferDraftPageProps = {
  searchParams?: unknown;
};

export default async function OfferDraftPage({ searchParams }: OfferDraftPageProps) {
  const recordId = extractRecordId(await Promise.resolve(searchParams));
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);
  const record = recordId ? await getCrmRecord(recordId, { workspaceSlug: access.workspaceSlug }) : null;
  const workflowId = recordId ? `offer-draft:${recordId}` : 'offer-draft';
  const displayRecord = record?.id === recordId ? record : null;
  const subtitle = displayRecord
    ? `Opening from live CRM record ${displayRecord.displayName} with draft persistence, validation checks, and mobile-safe controls.`
    : 'Interactive offer drafting with editable form state, backend draft persistence, live CRM data, validation checks, and mobile-safe action controls.';

  return (
    <WorkflowStudio
      key={workflowId}
      eyebrow="Offer workflow map"
      title="Offer Draft Screen"
      routeLabel={displayRecord ? `/dashboard → ${displayRecord.displayName}` : '/workflows/offer-draft'}
      subtitle={subtitle}
      workflowId={workflowId}
      storageKey={`workflow-offer-draft${recordId ? `:${recordId}` : ''}`}
      summaryItems={buildOfferSummaryItems(displayRecord)}
      workspaceId={access.workspaceSlug}
      existingSessionId={recordId ?? undefined}
      sections={offerSections as unknown as Parameters<typeof WorkflowStudio>[0]['sections']}
      actions={offerActions as unknown as Parameters<typeof WorkflowStudio>[0]['actions']}
      validationTitle="Offer validation"
      validationNotes={[
        'Source labels remain visible beside imported values so the agent knows what came from approved data.',
        'The workflow blocks signature sending until required fields are complete.',
        'Save Draft writes the current package to local storage first so the mobile experience stays reliable.',
      ]}
      mobileNotes={[
        'Use the sticky bottom action bar to save or request review on mobile.',
        'Source provenance remains visible in the side rail when the screen collapses.',
        'Review the draft package before sending it to the broker or client.',
      ]}
      provenanceTitle="Source provenance"
      provenanceNotes={[
        'CRM data is loaded from the live dashboard record when available.',
        'Offer terms can be traced back to the connected CRM record and MLS source.',
        'Broker approval remains the final gate before signature or submission.',
      ]}
      defaultValues={buildOfferDefaults(displayRecord)}
      activitySeed={buildOfferActivitySeed(displayRecord)}
    />
  );
}

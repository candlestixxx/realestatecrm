import { WorkflowStudio } from '@/components/workflows/workflow-studio';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import {
  buildOfferActivitySeed,
  buildOfferDefaults,
  buildOfferSummaryItems,
} from '@/lib/crm-records';
import { requireWorkspaceAccess } from '@/lib/workspace-access';

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
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OfferDraftPage(props: OfferDraftPageProps) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  
  const leadId = typeof searchParams?.leadId === 'string' ? searchParams.leadId : null;
  const dealId = typeof searchParams?.dealId === 'string' ? searchParams.dealId : null;
  const sessionId = typeof searchParams?.sessionId === 'string' ? searchParams.sessionId : null;
  
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);
  
  let crmContext: any = null;
  let connectionId = '';

  if (leadId) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId, workspaceId: access.workspaceId },
      include: { contact: true }
    });
    if (lead) {
      crmContext = {
        displayName: `${lead.contact.firstName} ${lead.contact.lastName || ''}`.trim(),
        status: lead.status,
        sourceSystem: lead.source,
        payload: { buyerName: `${lead.contact.firstName} ${lead.contact.lastName || ''}`.trim() }
      };
      connectionId = `lead:${leadId}`;
    }
  } else if (dealId) {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId, workspaceId: access.workspaceId },
      include: { contact: true }
    });
    if (deal) {
      crmContext = {
        displayName: deal.title,
        status: deal.stage,
        sourceSystem: 'CRM Deal',
        payload: { buyerName: `${deal.contact.firstName} ${deal.contact.lastName || ''}`.trim() }
      };
      connectionId = `deal:${dealId}`;
    }
  }

  const workflowId = connectionId ? `offer-draft:${connectionId}` : 'offer-draft';
  const subtitle = crmContext
    ? `Opening from live CRM record ${crmContext.displayName} with draft persistence, validation checks, and mobile-safe controls.`
    : 'Interactive offer drafting with editable form state, backend draft persistence, live CRM data, validation checks, and mobile-safe action controls.';

  return (
    <WorkflowStudio
      key={workflowId}
      eyebrow="Offer workflow map"
      title="Offer Draft Screen"
      routeLabel={crmContext ? `/dashboard → ${crmContext.displayName}` : '/workflows/offer-draft'}
      subtitle={subtitle}
      workflowId={workflowId}
      storageKey={`workflow-offer-draft${connectionId ? `:${connectionId}` : ''}`}
      summaryItems={buildOfferSummaryItems(crmContext)}
      workspaceId={access.workspaceSlug}
      existingSessionId={sessionId ?? undefined}
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
      defaultValues={buildOfferDefaults(crmContext)}
      activitySeed={buildOfferActivitySeed(crmContext)}
    />
  );
}

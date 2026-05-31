import { WorkflowStudio } from '@/components/workflows/workflow-studio';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';

const foreclosureSections = [
  {
    title: 'Notice capture',
    description:
      'Record the source notice details exactly as published before any enrichment or CRM sync.',
    fields: [
      { key: 'county', label: 'County', type: 'text', required: true, source: 'Legal News' },
      { key: 'noticeType', label: 'Notice type', type: 'text', required: true, source: 'Legal News' },
      {
        key: 'publishedDate',
        label: 'Published date',
        type: 'date',
        required: true,
        source: 'Legal News',
      },
      {
        key: 'saleDate',
        label: 'Sale date',
        type: 'date',
        source: 'Legal News',
        helper: 'Use TBD when the notice does not include a sale date.',
      },
      {
        key: 'mortgagorName',
        label: 'Mortgagor / owner name',
        type: 'text',
        required: true,
        source: 'Legal News',
      },
      {
        key: 'propertyAddress',
        label: 'Property address',
        type: 'text',
        required: true,
        source: 'Legal News',
      },
      { key: 'city', label: 'City', type: 'text', source: 'Legal News' },
      { key: 'zip', label: 'ZIP', type: 'text', source: 'Legal News' },
    ],
  },
  {
    title: 'Notice details and compliance',
    description:
      'Keep the public-record notice body, legal description, and compliance details visible for review.',
    fields: [
      {
        key: 'amountDueText',
        label: 'Amount due text',
        type: 'text',
        required: true,
        source: 'Legal News',
      },
      {
        key: 'attorneyName',
        label: 'Attorney name',
        type: 'text',
        source: 'Legal News',
      },
      {
        key: 'lawFirm',
        label: 'Law firm',
        type: 'text',
        source: 'Legal News',
      },
      {
        key: 'attorneyPhone',
        label: 'Attorney phone',
        type: 'text',
        source: 'Legal News',
      },
      { key: 'fileNumber', label: 'File number', type: 'text', source: 'Legal News' },
      { key: 'parcelId', label: 'Parcel / tax ID', type: 'text', source: 'Legal News' },
      {
        key: 'redemptionPeriod',
        label: 'Redemption period',
        type: 'text',
        source: 'Legal News',
      },
      {
        key: 'sourceUrl',
        label: 'Source URL',
        type: 'text',
        required: true,
        source: 'Legal News',
      },
      {
        key: 'rawNoticeText',
        label: 'Raw notice text',
        type: 'textarea',
        required: true,
        source: 'Legal News',
        placeholder: 'Paste the full notice body here so the public record stays intact.',
      },
    ],
  },
  {
    title: 'CRM prep and sync gate',
    description:
      'Prepare the lead for review, assignment, notes, tags, and optional Lofty sync once validated.',
    fields: [
      {
        key: 'confidence',
        label: 'Confidence level',
        type: 'select',
        required: true,
        options: ['high', 'medium', 'review'],
        source: 'Workflow',
      },
      {
        key: 'leadStatus',
        label: 'Lead status',
        type: 'select',
        required: true,
        options: ['PREFORECLOSURE', 'REVIEW', 'READY_FOR_SYNC', 'SYNCED'],
        source: 'Workflow',
      },
      {
        key: 'assignedAgent',
        label: 'Assigned agent',
        type: 'select',
        options: ['Unassigned', 'Hank Mendez', 'Harry'],
        source: 'Workflow',
      },
      {
        key: 'tags',
        label: 'Tags',
        type: 'text',
        source: 'Workflow',
        helper: 'Default tags include #PreForeclosure, county:macomb, and source:legalnews.',
      },
      {
        key: 'notes',
        label: 'CRM notes',
        type: 'textarea',
        source: 'Workflow',
        placeholder: 'Summarize the notice and add any review notes before sync.',
      },
    ],
  },
] as const;

const foreclosureActions = [
  { id: 'save', label: 'Save Draft', tone: 'ghost' },
  { id: 'validate', label: 'Validate Notice', tone: 'secondary' },
  { id: 'review', label: 'Request Review', tone: 'secondary' },
  { id: 'package', label: 'Queue for Lofty', tone: 'ghost' },
  { id: 'submit', label: 'Sync to Lofty', tone: 'primary' },
] as const;

type ForeclosureIntakePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ForeclosureIntakePage(props: ForeclosureIntakePageProps) {
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
        payload: { mortgagorName: `${lead.contact.firstName} ${lead.contact.lastName || ''}`.trim() }
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
        payload: { mortgagorName: `${deal.contact.firstName} ${deal.contact.lastName || ''}`.trim() }
      };
      connectionId = `deal:${dealId}`;
    }
  }

  const workflowId = connectionId ? `foreclosure-intake:${connectionId}` : 'foreclosure-intake';

  const foreclosureSummaryItems = [
    { label: 'County', value: 'Macomb', source: 'Legal News' },
    { label: 'Pipeline', value: 'Foreclosure intake', source: 'Workflow' },
    { label: 'Status', value: crmContext ? crmContext.status : 'Preforeclosure review', source: 'CRM' },
    { label: 'Sync gate', value: 'Human review before Lofty', source: 'Compliance', accent: true },
  ];

  const foreclosureDefaults = {
    county: 'Macomb',
    noticeType: 'Foreclosure by Advertisement',
    publishedDate: new Date().toISOString().split('T')[0],
    saleDate: '',
    mortgagorName: crmContext ? crmContext.payload.mortgagorName : '',
    propertyAddress: '',
    city: '',
    zip: '',
    amountDueText: '',
    attorneyName: '',
    lawFirm: '',
    attorneyPhone: '',
    fileNumber: '',
    parcelId: '',
    redemptionPeriod: '6 months',
    sourceUrl: 'https://www.legalnews.com/County/Notices?location=macomb',
    rawNoticeText: '',
    confidence: 'review',
    leadStatus: 'PREFORECLOSURE',
    assignedAgent: 'Unassigned',
    tags: '#PreForeclosure, county:macomb, source:legalnews',
    notes: 'Review the notice body and confirm the source-to-CRM mapping before sync.',
  };

  const foreclosureActivitySeed = [
    {
      title: 'Loaded from Legal News source',
      detail:
        'The workflow opens with the Macomb County Foreclosures bucket and a manual review gate before sync.',
      timestamp: 'Now',
    },
    {
      title: 'Source text preserved',
      detail: 'The raw notice body is kept intact for compliance, auditability, and future enrichment.',
      timestamp: 'Earlier',
    },
  ];

  const subtitle = crmContext
    ? `Opening from live CRM record ${crmContext.displayName} with exact public-record capture, CRM prep, and a human review gate before Lofty sync.`
    : "A source-first intake screen for Macomb County foreclosure notices, with exact public-record capture, CRM prep, and a human review gate before Lofty sync.";

  return (
    <WorkflowStudio
      key={workflowId}
      eyebrow="Foreclosure workflow map"
      title="Foreclosure Intake Screen"
      routeLabel={crmContext ? `/dashboard → ${crmContext.displayName}` : "/workflows/foreclosure-intake"}
      subtitle={subtitle}
      workflowId={workflowId}
      storageKey={`workflow-foreclosure-intake${connectionId ? `:${connectionId}` : ''}`}
      summaryItems={foreclosureSummaryItems}
      workspaceId={access.workspaceSlug}
      existingSessionId={sessionId ?? undefined}
      sections={foreclosureSections as unknown as Parameters<typeof WorkflowStudio>[0]['sections']}
      actions={foreclosureActions as unknown as Parameters<typeof WorkflowStudio>[0]['actions']}
      validationTitle="Foreclosure validation"
      validationNotes={[
        'Keep the raw Legal News notice body visible until the record is reviewed.',
        'Treat sale date, amount due, attorney, and address as source-controlled fields.',
        'Do not sync to Lofty until the record passes the human review gate.',
      ]}
      mobileNotes={[
        'The screen collapses into a single-column review flow on mobile.',
        'Sticky actions keep Save Draft, Review, and Sync controls available while scrolling.',
        'Source provenance stays visible so the operator can confirm the county and notice type fast.',
      ]}
      provenanceTitle="Source provenance"
      provenanceNotes={[
        'Legal News Macomb Foreclosures is the source of truth for this workflow.',
        'The public-record notice text is stored verbatim for auditability.',
        'Any enrichment or campaign step happens only after validation.',
      ]}
      defaultValues={foreclosureDefaults}
      activitySeed={foreclosureActivitySeed}
    />
  );
}

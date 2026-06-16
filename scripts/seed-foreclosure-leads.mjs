// Seed script to add foreclosure leads from Macomb County
// Run: node scripts/seed-foreclosure-leads.mjs

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FORECLOSURE_LEADS = [
  {
    firstName: 'James',
    lastName: 'Garcia',
    email: 'james.garcia@email.com',
    phone: '586-555-1204',
    address: '45216 Hayes Rd, Macomb, MI 48042',
    source: 'Macomb County Foreclosure Notice',
    status: 'PREFORECLOSURE',
    type: 'SELLER',
    score: 88,
    tags: 'preforeclosure,macomb-county,notice-served',
    notes: 'Property listed in Macomb County preforeclosure docket. Notice of Default filed. Estimated equity: $45,000. Contacted via certified mail.',
  },
  {
    firstName: 'Maria',
    lastName: 'Torres',
    email: 'maria.torres@email.com',
    phone: '586-555-2317',
    address: '32185 Gratiot Ave, Roseville, MI 48066',
    source: 'Macomb County Foreclosure Notice',
    status: 'PREFORECLOSURE',
    type: 'SELLER',
    score: 82,
    tags: 'preforeclosure,macomb-county,notice-served',
    notes: 'Lis Pendens filed. 30 days delinquent. 3-bedroom home. Owner may be interested in short sale options.',
  },
  {
    firstName: 'Robert',
    lastName: 'Johnson',
    email: 'r.johnson@email.com',
    phone: '586-555-3492',
    address: '17823 E Warren Ave, Detroit, MI 48224',
    source: 'Macomb County Foreclosure Notice',
    status: 'PREFORECLOSURE',
    type: 'SELLER',
    score: 75,
    tags: 'preforeclosure,wayne-county,high-equity',
    notes: 'Notice of default served. Property has significant equity. Ideal candidate for short sale or loan modification assistance.',
  },
  {
    firstName: 'Patricia',
    lastName: 'Williams',
    email: 'pwilliams@email.com',
    phone: '586-555-4567',
    address: '56423 Schoenherr Rd, Shelby Twp, MI 48316',
    source: 'Macomb County Foreclosure Notice',
    status: 'PREFORECLOSURE',
    type: 'SELLER',
    score: 90,
    tags: 'preforeclosure,macomb-county,urgent',
    notes: 'Auction date approaching within 60 days. High priority contact. Owner may be receptive to cash offer or short sale.',
  },
  {
    firstName: 'Thomas',
    lastName: 'Brown',
    email: 'thomas.brown@email.com',
    phone: '586-555-5678',
    address: '89123 Van Dyke Ave, Utica, MI 48317',
    source: 'Macomb County Foreclosure Notice',
    status: 'PREFORECLOSURE',
    type: 'SELLER',
    score: 78,
    tags: 'preforeclosure,macomb-county,notice-served',
    notes: 'Notice of Default filed. Property in good condition. Owner may consider deed-in-lieu of foreclosure.',
  },
  {
    firstName: 'Jennifer',
    lastName: 'Martinez',
    email: 'jen.martinez@email.com',
    phone: '586-555-6789',
    address: '23456 Hall Rd, Clinton Twp, MI 48038',
    source: 'Macomb County Foreclosure Notice',
    status: 'PREFORECLOSURE',
    type: 'SELLER',
    score: 85,
    tags: 'preforeclosure,macomb-county,cash-offer-potential',
    notes: '90 days delinquent. Notice of default sent. Need to assess if owner is interested in short sale or cash purchase.',
  },
  {
    firstName: 'David',
    lastName: 'Anderson',
    email: 'david.anderson@email.com',
    phone: '586-555-7890',
    address: '67819 Jefferson Ave, St Clair Shores, MI 48081',
    source: 'Macomb County Foreclosure Notice',
    status: 'PREFORECLOSURE',
    type: 'SELLER',
    score: 72,
    tags: 'preforeclosure,macomb-county,notice-served',
    notes: 'County foreclosure docket entry. Owner may need education on options including loan modification and short sale.',
  },
  {
    firstName: 'Lisa',
    lastName: 'Taylor',
    email: 'ltaylor@email.com',
    phone: '586-555-8901',
    address: '34567 Garfield Rd, Fraser, MI 48026',
    source: 'Legal News - Foreclosure Notice',
    status: 'PREFORECLOSURE',
    type: 'SELLER',
    score: 80,
    tags: 'preforeclosure,macomb-county,high-priority',
    notes: 'Published in Legal News. Preforeclosure listing. Recommended action: immediate outreach to discuss resolution options.',
  },
  {
    firstName: 'Michael',
    lastName: 'Wilson',
    email: 'mwilson@email.com',
    phone: '586-555-9012',
    address: '78912 Masonic Blvd, Warren, MI 48093',
    source: 'Legal News - Foreclosure Notice',
    status: 'PREFORECLOSURE',
    type: 'SELLER',
    score: 76,
    tags: 'preforeclosure,macomb-county,long-delinquency',
    notes: '120+ days delinquent. Notice of default published. Owner may be further along in process. Assess for short sale readiness.',
  },
  {
    firstName: 'Amanda',
    lastName: 'Clark',
    email: 'aclark@email.com',
    phone: '586-555-0123',
    address: '54321 14 Mile Rd, Sterling Heights, MI 48310',
    source: 'Macomb County Foreclosure Notice',
    status: 'PREFORECLOSURE',
    type: 'SELLER',
    score: 70,
    tags: 'preforeclosure,macomb-county,auction-risk',
    notes: 'Notice of default sent. Property value exceeds loan balance. Strong candidate for short sale or cash purchase.',
  },
];

async function main() {
  console.log('Seeding foreclosure leads...');

  // Get the workspace
  const workspace = await prisma.workspace.findFirst();
  if (!workspace) {
    console.error('No workspace found. Run the main seed first.');
    process.exit(1);
  }

  // Get the default agent (Harry Kourlos or first agent)
  const agent = await prisma.user.findFirst({
    where: { workspaces: { some: { workspaceId: workspace.id } } },
    orderBy: { createdAt: 'asc' },
  });

  let added = 0;
  let skipped = 0;

  for (const leadData of FORECLOSURE_LEADS) {
    // Check if a lead with this address already exists to avoid duplicates
    const existingContact = await prisma.contact.findFirst({
      where: { phone: leadData.phone, workspaceId: workspace.id },
    });

    if (existingContact) {
      console.log(`  Skipping ${leadData.firstName} ${leadData.lastName} (already exists)`);
      skipped++;
      continue;
    }

    // Create the contact
    const contact = await prisma.contact.create({
      data: {
        firstName: leadData.firstName,
        lastName: leadData.lastName,
        email: leadData.email,
        phone: leadData.phone,
        address: leadData.address,
        workspaceId: workspace.id,
      },
    });

    // Create the lead
    const lead = await prisma.lead.create({
      data: {
        type: leadData.type,
        source: leadData.source,
        status: leadData.status,
        score: leadData.score,
        tags: leadData.tags,
        workspaceId: workspace.id,
        contactId: contact.id,
        userId: agent?.id || null,
      },
    });

    // Create initial activity note
    await prisma.activity.create({
      data: {
        type: 'NOTE',
        content: leadData.notes,
        workspaceId: workspace.id,
        leadId: lead.id,
        userId: agent?.id || null,
      },
    });

    // Assign to "Preforeclosure" segment if it exists
    const preforeclosureSegment = await prisma.segment.findFirst({
      where: { name: 'Preforeclosure', workspaceId: workspace.id },
    });

    if (preforeclosureSegment) {
      await prisma.segment.update({
        where: { id: preforeclosureSegment.id },
        data: {
          leads: { connect: { id: lead.id } },
        },
      });
    }

    added++;
    console.log(`  Added: ${leadData.firstName} ${leadData.lastName} (${leadData.address})`);
  }

  console.log(`\nDone! Added ${added} foreclosure leads, skipped ${skipped} duplicates.`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

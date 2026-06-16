import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing to prevent duplicates on multiple seed runs
  await prisma.workflowSession.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workspace.deleteMany();

  // Create Workspace
  const workspace = await prisma.workspace.create({
    data: {
      id: 'excel-legacy-team',
      name: 'Excel Legacy Realty Group',
    },
  });

  // Create Users (Identities requested by user)
  const admin = await prisma.user.create({
    data: {
      id: 'universal-admin',
      name: 'Universal Admin',
      email: 'admin@excellegacy.com',
      role: 'OWNER',
    },
  });

  const hank = await prisma.user.create({
    data: {
      name: 'Hank Mendez',
      email: 'hankrealtyexec@gmail.com',
      role: 'BROKER',
    },
  });

  const harry = await prisma.user.create({
    data: {
      name: 'Harry Kourlos',
      email: 'harryrealtyexec@gmail.com',
      role: 'REALTOR_AGENT',
    },
  });

  const don = await prisma.user.create({
    data: {
      name: 'Don Sobieski',
      email: 'realtordon26@gmail.com',
      role: 'REALTOR_AGENT',
    },
  });

  // Link Users to Workspace
  await prisma.workspaceMember.createMany({
    data: [
      {
        userId: admin.id,
        workspaceId: workspace.id,
        role: 'OWNER',
      },
      {
        userId: hank.id,
        workspaceId: workspace.id,
        role: 'BROKER',
      },
      {
        userId: harry.id,
        workspaceId: workspace.id,
        role: 'REALTOR_AGENT',
      },
      {
        userId: don.id,
        workspaceId: workspace.id,
        role: 'REALTOR_AGENT',
      },
    ],
  });

  // Create Contacts
  const contact1 = await prisma.contact.create({
    data: {
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: 'sarah@example.com',
      phone: '555-0192',
      workspaceId: workspace.id,
    },
  });

  const contact2 = await prisma.contact.create({
    data: {
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'mchen@example.com',
      phone: '555-8472',
      workspaceId: workspace.id,
    },
  });

  const contact3 = await prisma.contact.create({
    data: {
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'emily.d@example.com',
      phone: '555-3321',
      workspaceId: workspace.id,
    },
  });

  // Create Leads
  await prisma.lead.create({
    data: {
      source: 'Zillow',
      status: 'NEW',
      score: 85,
      workspaceId: workspace.id,
      contactId: contact1.id,
      userId: harry.id,
    },
  });

  await prisma.lead.create({
    data: {
      source: 'Referral',
      status: 'QUALIFIED',
      score: 92,
      workspaceId: workspace.id,
      contactId: contact2.id,
      userId: harry.id,
    },
  });

  // Create Deals
  await prisma.deal.create({
    data: {
      title: 'Smith Family Home',
      value: 650000,
      stage: 'QUALIFICATION',
      workspaceId: workspace.id,
      contactId: contact1.id,
      userId: harry.id,
    },
  });

  await prisma.deal.create({
    data: {
      title: '789 Pine Rd',
      value: 890000,
      stage: 'UNDER_CONTRACT',
      workspaceId: workspace.id,
      contactId: contact2.id,
      userId: harry.id,
    },
  });

  // --- Seed Smart Plan Templates ---
  const smartPlanTemplates = [
    {
      name: 'ELRT-Pre Foreclosure GPT',
      description: 'When a Seller lead is reassigned, this plan launches a paced outreach campaign designed to re-engage them and move them through the pipeline. It updates the pipeline, then sends an email and automated text.',
      steps: JSON.stringify([
        { id: '1', type: 'TASK', delayValue: 0, delayUnit: 'SECOND', content: 'Change Pipeline Stage to Preforeclosure' },
        { id: '2', type: 'EMAIL', delayValue: 5, delayUnit: 'MINUTE', subject: 'Facing Pre Foreclosure?', content: 'Hi, I saw your property notices and wanted to see if we can chat about options to protect your equity...' },
        { id: '3', type: 'SMS', delayValue: 10, delayUnit: 'MINUTE', content: 'Hi, know your options. I specialize in preforeclosure resolutions in Macomb County. Let me know if you want to chat.' },
        { id: '4', type: 'CALL', delayValue: 1, delayUnit: 'DAY', content: 'Call lead to discuss short sale or modification options.' }
      ]),
      isActive: true,
      workspaceId: workspace.id,
    },
    {
      name: 'ELRT PreForeclosure Campaign',
      description: 'Brokerage-wide preforeclosure campaign to nurture leads facing home foreclosure notices. Sends a paced combination of educational guides and check-ins.',
      steps: JSON.stringify([
        { id: '1', type: 'EMAIL', delayValue: 1, delayUnit: 'DAY', subject: 'Foreclosure Help Packet', content: 'Here is a list of options you can take to stop foreclosure. Don\'t ignore the banks.' },
        { id: '2', type: 'SMS', delayValue: 3, delayUnit: 'DAY', content: 'Hi, just following up to make sure you got the Foreclosure Help PDF I sent you? I\'m here to help.' },
        { id: '3', type: 'CALL', delayValue: 7, delayUnit: 'DAY', content: 'Call lead to offer free CMA evaluation.' }
      ]),
      isActive: true,
      workspaceId: workspace.id,
    },
    {
      name: 'B-Lead wants to buy after 12 months',
      description: 'Long-term nurture campaign for buyers who are planning to buy a home more than a year from now. Sends soft market updates and quarterly check-ins.',
      steps: JSON.stringify([
        { id: '1', type: 'EMAIL', delayValue: 7, delayUnit: 'DAY', subject: 'Market Update', content: 'Here is what\'s happening in your target market this month.' },
        { id: '2', type: 'EMAIL', delayValue: 30, delayUnit: 'DAY', subject: 'New Listings Worth Seeing', content: 'A few new properties hit the market that match your criteria.' },
        { id: '3', type: 'CALL', delayValue: 90, delayUnit: 'DAY', content: 'Quarterly check-in to see if timeline has changed.' }
      ]),
      isActive: true,
      workspaceId: workspace.id,
    },
    {
      name: 'New Inbound Buyer Lead Drip',
      description: 'High-touch follow-up sequence for newly registered buyers to qualify their timeline and budget.',
      steps: JSON.stringify([
        { id: '1', type: 'SMS', delayValue: 5, delayUnit: 'MINUTE', content: 'Hi! Thanks for checking out homes. Are you looking to move in the next 30-60 days, or just browsing?' },
        { id: '2', type: 'EMAIL', delayValue: 1, delayUnit: 'HOUR', subject: 'Your custom home search guide', content: 'Here is a list of active properties in your preferred area.' },
        { id: '3', type: 'CALL', delayValue: 1, delayUnit: 'DAY', content: 'Qualifying call: Ask about financing/pre-approval and home criteria.' },
        { id: '4', type: 'EMAIL', delayValue: 3, delayUnit: 'DAY', subject: 'Have you seen these listings yet?', content: 'Checking in to see if any recent listings match what you are looking for.' }
      ]),
      isActive: true,
      workspaceId: workspace.id,
    },
    {
      name: 'FSBO (For Sale By Owner) Smart Plan',
      description: 'Informative drip campaign highlighting the benefits of working with a professional to secure top dollar.',
      steps: JSON.stringify([
        { id: '1', type: 'EMAIL', delayValue: 1, delayUnit: 'HOUR', subject: 'Thinking of Selling?', content: 'Here is what a professional agent can do to maximize your sale price.' },
        { id: '2', type: 'SMS', delayValue: 2, delayUnit: 'DAY', content: 'Hi, just wanted to share some tips on pricing your home right. Happy to chat anytime.' },
        { id: '3', type: 'CALL', delayValue: 5, delayUnit: 'DAY', content: 'Follow-up call to discuss FSBO challenges and agent value proposition.' }
      ]),
      isActive: true,
      workspaceId: workspace.id,
    },
  ];

  for (const template of smartPlanTemplates) {
    await prisma.smartPlan.create({ data: template });
  }

  console.log('Seeded ' + smartPlanTemplates.length + ' smart plan templates.');
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

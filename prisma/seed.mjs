import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing to prevent duplicates on multiple seed runs
  await prisma.leadQualification.deleteMany().catch(() => {});
  await prisma.leadRoutingRule.deleteMany().catch(() => {});
  await prisma.agentWorkflow.deleteMany().catch(() => {});
  await prisma.agentLog.deleteMany().catch(() => {});
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


  // Create additional Contacts + Leads for demo variety
  const extraContacts = [
    { firstName: 'Robert', lastName: 'Williams', email: 'rwilliams@example.com', phone: '555-4401', workspaceId: workspace.id },
    { firstName: 'Lisa', lastName: 'Anderson', email: 'lisa.a@example.com', phone: '555-7723', workspaceId: workspace.id },
    { firstName: 'James', lastName: 'Taylor', email: 'jtaylor@example.com', phone: '555-9910', workspaceId: workspace.id },
    { firstName: 'Maria', lastName: 'Garcia', email: 'mgarcia@example.com', phone: '555-3345', workspaceId: workspace.id },
    { firstName: 'David', lastName: 'Martinez', email: 'dmartinez@example.com', phone: '555-2211', workspaceId: workspace.id },
    { firstName: 'Jennifer', lastName: 'Brown', email: 'jbrown@example.com', phone: '555-6678', workspaceId: workspace.id },
    { firstName: 'Christopher', lastName: 'Lee', email: 'clee@example.com', phone: '555-8890', workspaceId: workspace.id },
    { firstName: 'Amanda', lastName: 'Wilson', email: 'awilson@example.com', phone: '555-1122', workspaceId: workspace.id },
  ];
  const createdExtra = [];
  for (const c of extraContacts) {
    createdExtra.push(await prisma.contact.create({ data: c }));
  }

  const leadStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'NURTURE', 'APPOINTMENT', 'PROPOSAL', 'CLOSED_WON', 'CLOSED_LOST'];
  const leadSources = ['Zillow', 'Realtor.com', 'Referral', 'Facebook', 'Website', 'Open House', 'Cold Call', 'MyPlusLeads'];
  const leadTypes = ['BUYER', 'SELLER'];
  for (let i = 0; i < createdExtra.length; i++) {
    await prisma.lead.create({
      data: {
        type: leadTypes[i % leadTypes.length],
        source: leadSources[i % leadSources.length],
        status: leadStatuses[i % leadStatuses.length],
        score: 40 + ((i * 7) % 60),
        workspaceId: workspace.id,
        contactId: createdExtra[i].id,
        userId: i % 2 === 0 ? harry.id : don.id,
        isAiAssisted: i % 3 === 0,
        tags: i % 2 === 0 ? '#firsttimebuyer' : '#investor',
      },
    });
  }

  // Seed Activities
  const allLeads = await prisma.lead.findMany();
  const activityTypes = ['NOTE', 'CALL', 'EMAIL', 'SMS', 'MEETING'];
  for (let i = 0; i < 8; i++) {
    const lead = allLeads[i % allLeads.length];
    await prisma.activity.create({
      data: {
        type: activityTypes[i % activityTypes.length],
        content: [
          'Initial contact made. Buyer pre-approved up to \.',
          'Called about listing at 456 Oak Ave. Left voicemail.',
          'Sent follow-up email with 3 comparable properties.',
          'SMS conversation: scheduling showing for Saturday 2pm.',
          'Met at open house. Interested in 3-bed/2-bath in Warren.',
          'Discussed short sale options. Seller is behind on payments.',
          'Sent market analysis report for seller lead.',
          'Called to check timeline. Still 6-12 months out.',
        ][i],
        workspaceId: workspace.id,
        userId: harry.id,
        leadId: lead.id,
      },
    });
  }

  // Seed AgentWorkflow
  await prisma.agentWorkflow.create({
    data: {
      name: 'Auto-Qualify New Leads',
      description: 'When a new lead arrives, score it with AI and route to the best available agent.',
      trigger: 'NEW_LEAD',
      actions: JSON.stringify([
        { condition: 'always', actions: [
          { type: 'AI_SCORE', model: 'gpt-4o-mini' },
          { type: 'ROUTE', rule: 'round-robin' },
          { type: 'NOTIFY', channel: 'in-app' },
        ]},
      ]),
      isActive: true,
      workspaceId: workspace.id,
    },
  });

  await prisma.agentWorkflow.create({
    data: {
      name: 'Hot Lead Alert',
      description: 'When a lead score exceeds 80, send an immediate alert to the assigned agent.',
      trigger: 'SCORE_CHANGE',
      actions: JSON.stringify([
        { condition: 'score > 80', actions: [
          { type: 'NOTIFY', channel: 'sms' },
          { type: 'TASK', title: 'Call hot lead within 15 min' },
        ]},
      ]),
      isActive: true,
      workspaceId: workspace.id,
    },
  });

  // Seed LeadRoutingRule
  await prisma.leadRoutingRule.create({
    data: {
      name: 'Zillow Round-Robin',
      description: 'Distribute Zillow leads evenly across Harry and Don.',
      workspaceId: workspace.id,
      isActive: true,
      source: 'Zillow',
      agentIds: [harry.id, don.id].join(','),
      currentIndex: 0,
    },
  });

  await prisma.leadRoutingRule.create({
    data: {
      name: 'Referral to Broker',
      description: 'All referral leads go to Hank first.',
      workspaceId: workspace.id,
      isActive: true,
      source: 'Referral',
      agentIds: hank.id,
      currentIndex: 0,
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

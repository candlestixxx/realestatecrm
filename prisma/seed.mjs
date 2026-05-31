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
      name: 'Excel Legacy Realty Team',
    },
  });

  // Create Users (Identities requested by user)
  const hank = await prisma.user.create({
    data: {
      name: 'Hank Mendez',
      email: 'hank.mendez@excellegacy.local',
      role: 'BROKER',
    },
  });

  const harry = await prisma.user.create({
    data: {
      name: 'Harry',
      email: 'harry@excellegacy.local',
      role: 'REALTOR_AGENT',
    },
  });

  // Link Users to Workspace
  await prisma.workspaceMember.createMany({
    data: [
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

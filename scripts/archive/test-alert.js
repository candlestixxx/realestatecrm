const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const workspaceId = 'excel-legacy-team';

  // Create a mock contact
  const contact = await prisma.contact.create({
    data: {
      firstName: 'TestAlert',
      lastName: 'Inbound',
      email: 'test.alert@example.com',
      phone: '586-555-9999',
      address: '123 Test Alert Way, Mount Clemens, MI 48043',
      workspaceId: workspaceId
    }
  });

  // Create a new unread lead
  const lead = await prisma.lead.create({
    data: {
      type: 'BUYER',
      source: 'Test Inbound Sync',
      status: 'NEW',
      isRead: false,
      workspaceId: workspaceId,
      contactId: contact.id,
      createdAt: new Date()
    }
  });

  console.log(`Created new unread lead for testing alerts! Lead ID: ${lead.id}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

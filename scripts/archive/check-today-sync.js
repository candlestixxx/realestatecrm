const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const startOfToday = new Date('2026-07-08T00:00:00.000Z');
  
  const leads = await prisma.lead.findMany({
    where: {
      source: 'MyPlusLeads',
      createdAt: {
        gte: startOfToday
      }
    },
    include: {
      contact: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log(`Found ${leads.length} MyPlusLeads imported today (July 8, 2026):`);
  for (const lead of leads) {
    console.log(`- ${lead.contact.firstName} ${lead.contact.lastName || ''} (Phone: ${lead.contact.phone}, Created: ${lead.createdAt.toISOString()})`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

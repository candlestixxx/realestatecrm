const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const leads = await prisma.lead.findMany({
    where: {
      source: 'Macomb County Foreclosure Notice'
    },
    orderBy: {
      id: 'asc'
    }
  });

  console.log(`Found ${leads.length} foreclosure leads to update.`);

  for (let idx = 0; idx < leads.length; idx++) {
    const lead = leads[idx];
    // Subtract idx * 6 hours starting from 7 days ago
    const sequentialDate = new Date(Date.now() - (idx * 6 * 60 * 60 * 1000) - (7 * 24 * 60 * 60 * 1000));
    
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        createdAt: sequentialDate
      }
    });

    console.log(`Updated lead ${lead.id} to sequential date: ${sequentialDate.toISOString()}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

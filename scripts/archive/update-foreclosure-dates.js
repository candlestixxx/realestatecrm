const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const olderDate = new Date('2026-07-01T08:00:00.000Z');

  const result = await prisma.lead.updateMany({
    where: {
      source: 'Macomb County Foreclosure Notice'
    },
    data: {
      createdAt: olderDate
    }
  });

  console.log(`Updated ${result.count} foreclosure leads to have an older createdAt date (${olderDate.toISOString()})`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

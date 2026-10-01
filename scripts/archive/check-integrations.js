const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const integrations = await prisma.myPlusLeadsIntegration.findMany();
  console.log('Integrations:');
  console.log(JSON.stringify(integrations, null, 2));

  const history = await prisma.syncHistory?.findMany({
    take: 5,
    orderBy: { timestamp: 'desc' }
  });
  console.log('Sync History:');
  console.log(JSON.stringify(history, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

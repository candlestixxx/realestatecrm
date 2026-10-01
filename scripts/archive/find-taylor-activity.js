const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const activities = await prisma.activity.findMany({
    take: 10,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      lead: {
        include: {
          contact: true
        }
      }
    }
  });

  console.log('Last 10 activities:');
  for (const act of activities) {
    console.log(`- ID: ${act.id}, Type: ${act.type}, Lead: ${act.lead?.contact?.firstName} ${act.lead?.contact?.lastName}, Content: "${act.content.substring(0, 100)}..."`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

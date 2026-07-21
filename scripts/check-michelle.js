const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRawUnsafe("SELECT id, createdAt FROM Lead WHERE id LIKE '%cmrasame%' OR id LIKE '%cmrasao%'");
  console.log('Michelle Lead Dates:', result);
}

main().catch(console.error).finally(() => prisma.$disconnect());

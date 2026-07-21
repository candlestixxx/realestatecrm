const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRawUnsafe("SELECT id, createdAt FROM Lead ORDER BY createdAt DESC LIMIT 10");
  console.log('Raw Lead Dates:', result);
}

main().catch(console.error).finally(() => prisma.$disconnect());

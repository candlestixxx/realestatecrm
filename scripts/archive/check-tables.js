const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRawUnsafe(`SELECT name FROM sqlite_master WHERE type='table'`);
  console.log('Tables:', result);
}

main().catch(console.error).finally(() => prisma.$disconnect());

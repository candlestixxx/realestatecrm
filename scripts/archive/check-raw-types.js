const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRawUnsafe(`
    SELECT 
      id, 
      createdAt, 
      typeof(createdAt) as colType 
    FROM Lead 
    WHERE id = 'ld_robert-bradley_1375773' OR id = 'cmrasaobu00adf0jwv4judh2l'
  `);
  console.log('Raw database values and types:', result);
}

main().catch(console.error).finally(() => prisma.$disconnect());

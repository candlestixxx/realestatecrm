const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.contact.findMany({
  where: {
    lastName: {
      contains: 'Ferguson'
    }
  }
}).then(console.log).catch(console.error).finally(() => prisma.$disconnect());

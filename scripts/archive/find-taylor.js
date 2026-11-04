const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.contact.findMany({
  where: {
    firstName: {
      contains: 'Taylor'
    }
  },
  include: {
    leads: {
      include: {
        Activity: true
      }
    }
  }
}).then(res => {
  console.log(JSON.stringify(res, null, 2));
}).catch(console.error).finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const leads = await prisma.lead.findMany({
    where: {
      createdAt: {
        gte: today,
      },
    },
    select: {
      source: true,
      status: true,
      contact: {
        select: {
          firstName: true,
          lastName: true,
        }
      }
    }
  });

  console.log(`Today's Leads details:`, JSON.stringify(leads, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

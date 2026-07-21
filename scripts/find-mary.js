const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const leads = await prisma.lead.findMany({
    where: {
      contact: {
        firstName: {
          contains: 'Mary'
        }
      }
    },
    include: {
      contact: true,
      workspace: true
    }
  });

  console.log(`Found ${leads.length} leads matching Mary:`);
  for (const lead of leads) {
    console.log(`- ID: ${lead.id}, Workspace: ${lead.workspaceId} (${lead.workspace.name}), Source: ${lead.source}, CreatedAt: ${lead.createdAt}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

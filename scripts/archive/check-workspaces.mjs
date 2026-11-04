import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const workspaces = await prisma.workspace.findMany();
  console.log(JSON.stringify(workspaces, null, 2));
  const members = await prisma.workspaceMember.findMany();
  console.log(JSON.stringify(members, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());

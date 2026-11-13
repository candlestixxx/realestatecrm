import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const workspaces = await prisma.workspace.findMany();
  console.log('Workspaces:', workspaces);
  const segments = await prisma.segment.findMany();
  console.log('Segments count:', segments.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());

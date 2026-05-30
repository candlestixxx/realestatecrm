import { PrismaClient } from '@prisma/client';
import path from 'node:path';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${path.resolve(process.cwd(), 'prisma', 'dev.db')}`;
}

const prismaClientSingleton = () => new PrismaClient();

declare global {
  var __prismaClient: PrismaClient | undefined;
}

export function getPrismaClient() {
  if (!globalThis.__prismaClient) {
    globalThis.__prismaClient = prismaClientSingleton();
  }

  return globalThis.__prismaClient;
}

const prisma = globalThis.__prismaClient ?? getPrismaClient();

export default prisma;

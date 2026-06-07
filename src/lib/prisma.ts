import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const libsql = createClient({
  url: `${process.env.TURSO_DATABASE_URL || 'file:./prisma/dev.db'}`,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const adapter = new PrismaLibSQL(libsql as any)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ['query', 'info', 'warn', 'error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma

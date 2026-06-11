import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL || 'file:./db/custom.db'

  // Turso / libSQL: url starts with "libsql://" or "file:"
  if (url.startsWith('libsql://')) {
    // For Turso, Prisma 6+ supports libsql natively with @prisma/adapter-libsql
    // But we use the simpler approach: just let Prisma handle it with the right driver
    return new PrismaClient({
      datasourceUrl: url,
    })
  }

  return new PrismaClient()
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
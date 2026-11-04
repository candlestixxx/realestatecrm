/** Verify contentplanner's Prisma client reaches the real Postgres. */
process.env.DATABASE_URL =
  'postgresql://postgres:contentcommand_dev_2026@localhost:5433/contentcommand?schema=public';

const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  try {
    await p.$connect();
    const tables = await p.$queryRawUnsafe(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
    );
    console.log('CONNECTED OK');
    console.log('tables:', tables.map((t) => t.tablename).join(', '));

    const ws = await p.workspace.count();
    console.log('workspace rows:', ws);

    // Confirm the billing columns landed (they were the schema change).
    const cols = await p.$queryRawUnsafe(
      "SELECT column_name FROM information_schema.columns WHERE table_name='Workspace' ORDER BY ordinal_position"
    );
    console.log('Workspace columns:', cols.map((c) => c.column_name).join(', '));

    await p.$disconnect();
  } catch (e) {
    console.log('FAIL:', e.message.split('\n')[0]);
    process.exit(1);
  }
})();

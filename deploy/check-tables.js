const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  .then(r => {
    console.log('Tables:', r.map(x => x.name).join(', '));
    return p.$disconnect();
  })
  .catch(e => {
    console.error('Error:', e.message);
    return p.$disconnect();
  });

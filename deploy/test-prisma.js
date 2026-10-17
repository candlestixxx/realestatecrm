const path = require('path');
const clientPath = path.join('/var/www/excellegacyrealtygroup', 'node_modules', '@prisma', 'client');
try {
  const p = require(clientPath);
  const c = new p.PrismaClient();
  c.user.findFirst().then(u => {
    console.log('Prisma OK:', u ? u.email : 'null');
    process.exit(0);
  }).catch(e => {
    console.error('Prisma query error:', e.message);
    process.exit(1);
  });
} catch(e) {
  console.error('Prisma require error:', e.message);
  process.exit(1);
}

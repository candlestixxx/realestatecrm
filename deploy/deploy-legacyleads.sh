#!/bin/bash
# Deploy LegacyLeads on Hetzner at port 3215
set -e

DEPLOY_DIR=/var/www/legacyleads
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

rm -rf .next server.js middleware.ts static public node_modules prisma
tar xzf /tmp/deploy-legacyleads.tar.gz

cat > .env << 'ENVEOF'
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="excel-legacy-legacyleads-secret-2026"
NEXTAUTH_URL="https://excellegacyrealtygroup.site/legacyleads"
PORT=3215
NODE_ENV=production
ENVEOF

mkdir -p prisma

pm2 delete legacyleads 2>/dev/null || true
PORT=3215 pm2 start server.js --name legacyleads --cwd "$DEPLOY_DIR"
pm2 save

echo "LegacyLeads deployed at port 3215"
pm2 list | grep legacyleads

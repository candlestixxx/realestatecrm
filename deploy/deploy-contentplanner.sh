#!/bin/bash
# Deploy ContentPlanner on Hetzner at port 3213
set -e

DEPLOY_DIR=/var/www/contentplanner
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

rm -rf .next server.js middleware.ts static public node_modules prisma
tar xzf /tmp/deploy-contentplanner.tar.gz

cat > .env << 'ENVEOF'
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="excel-legacy-contentplanner-secret-2026"
NEXTAUTH_URL="https://excellegacyrealtygroup.site/contentplanner"
PORT=3213
NODE_ENV=production
ENVEOF

mkdir -p prisma

pm2 delete contentplanner 2>/dev/null || true
PORT=3213 pm2 start server.js --name contentplanner --cwd "$DEPLOY_DIR"
pm2 save

echo "ContentPlanner deployed at port 3213"
pm2 list | grep contentplanner

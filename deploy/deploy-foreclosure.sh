#!/bin/bash
# Deploy Foreclosure Workflow on Hetzner at port 3212
set -e

DEPLOY_DIR=/var/www/foreclosure
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

rm -rf .next server.js middleware.ts static public node_modules prisma
tar xzf /tmp/deploy-foreclosure.tar.gz

cat > .env << 'ENVEOF'
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="excel-legacy-foreclosure-secret-2026"
NEXTAUTH_URL="https://excellegacyrealtygroup.site/foreclosure"
PORT=3212
NODE_ENV=production
ENVEOF

mkdir -p prisma

pm2 delete foreclosure 2>/dev/null || true
PORT=3212 pm2 start server.js --name foreclosure --cwd "$DEPLOY_DIR"
pm2 save

echo "Foreclosure deployed at port 3212"
pm2 list | grep foreclosure

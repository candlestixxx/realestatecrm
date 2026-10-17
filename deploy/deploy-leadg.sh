#!/bin/bash
# Deploy LeadG on Hetzner at port 3211
set -e

DEPLOY_DIR=/var/www/leadg
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

# Extract
rm -rf .next standalone server.js middleware.ts static public node_modules prisma
tar xzf /tmp/deploy-leadg.tar.gz

# Write .env
cat > .env << 'ENVEOF'
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="excel-legacy-leadg-secret-2026"
NEXTAUTH_URL="https://excellegacyrealtygroup.site/leadg"
PORT=3211
NODE_ENV=production
ENVEOF

# Ensure prisma dir exists
mkdir -p prisma

# Start with PM2
pm2 delete leadg 2>/dev/null || true
PORT=3211 pm2 start server.js --name leadg --cwd "$DEPLOY_DIR"
pm2 save

echo "LeadG deployed at port 3211"
pm2 list | grep leadg

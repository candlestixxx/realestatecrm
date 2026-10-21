#!/bin/bash
# Deploy ContentPlanner on Hetzner at port 3213
#
# Nondestructive: old build moved to backup. DeepSeek env preserved.
set -e

DEPLOY_DIR=/var/www/contentplanner
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

DEEPSEEK_ENV=""
if [ -f .env ]; then
  DEEPSEEK_ENV=$(grep '^DEEPSEEK' .env || true)
fi

BK=/tmp/contentplanner-backup-$(date +%Y%m%d-%H%M%S)
mkdir -p "$BK"
for f in .next server.js middleware.ts static public node_modules prisma; do
  [ -e "$f" ] && mv "$f" "$BK/" 2>/dev/null || true
done

tar xzf /tmp/deploy-contentplanner.tar.gz

cat > .env << ENVEOF
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="excel-legacy-contentplanner-secret-2026"
NEXTAUTH_URL="https://excellegacyrealtygroup.site/contentplanner"
PORT=3213
NODE_ENV=production
$DEEPSEEK_ENV
ENVEOF

mkdir -p prisma

pm2 delete contentplanner 2>/dev/null || true
PORT=3213 pm2 start server.js --name contentplanner --cwd "$DEPLOY_DIR"
pm2 save

echo "ContentPlanner deployed at port 3213 (old build in $BK)"
pm2 list | grep contentplanner

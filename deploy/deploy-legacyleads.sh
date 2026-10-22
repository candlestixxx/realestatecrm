#!/bin/bash
# Deploy LegacyLeads on Hetzner at port 3215
#
# Nondestructive: old build moved to backup. DeepSeek env preserved.
set -e

DEPLOY_DIR=/var/www/legacyleads
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

# Preserve all integration env vars (API key continuity across redeploys)
DEEPSEEK_ENV=""
if [ -f .env ]; then
  DEEPSEEK_ENV=$(grep -E '^(DEEPSEEK|VAPI|TWILIO|SENDGRID|LOB|SKIP_TRACE|BSA|REALCOMP|HEYGEN|DID|MAGNIFIC|CANVA|BROWSERLESS|TAVILY|NEWSAPI)' .env || true)
fi

BK=/tmp/legacyleads-backup-$(date +%Y%m%d-%H%M%S)
mkdir -p "$BK"
for f in .next server.js middleware.ts static public node_modules prisma; do
  [ -e "$f" ] && mv "$f" "$BK/" 2>/dev/null || true
done

tar xzf /tmp/deploy-legacyleads.tar.gz

cat > .env << ENVEOF
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="excel-legacy-legacyleads-secret-2026"
NEXTAUTH_URL="https://excellegacyrealtygroup.site/legacyleads"
PORT=3215
NODE_ENV=production
$DEEPSEEK_ENV
ENVEOF

mkdir -p prisma

pm2 delete legacyleads 2>/dev/null || true
PORT=3215 pm2 start server.js --name legacyleads --cwd "$DEPLOY_DIR"
pm2 save

echo "LegacyLeads deployed at port 3215 (old build in $BK)"
pm2 list | grep legacyleads

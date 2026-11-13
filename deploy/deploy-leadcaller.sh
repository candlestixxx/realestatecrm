#!/bin/bash
# Deploy Lead Caller on Hetzner at port 3219 (mounted publicly at /leadcaller/)
#
# Nondestructive: old build is moved to a timestamped backup dir instead of
# deleted. Expects /tmp/deploy-leadcaller.tar.gz (Next standalone, basePath
# /leadcaller + turbopack.root pin - see apps/leadcaller/next.config.ts).
set -e

DEPLOY_DIR=/var/www/leadcaller
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

BK=/tmp/leadcaller-backup-$(date +%Y%m%d-%H%M%S)
mkdir -p "$BK"
for f in .next server.js package.json node_modules public prisma; do
  [ -e "$f" ] && mv "$f" "$BK/" 2>/dev/null || true
done

tar xzf /tmp/deploy-leadcaller.tar.gz

mkdir -p prisma
[ -f prisma/schema.prisma ] || cp "$BK/prisma/schema.prisma" prisma/ 2>/dev/null || true

cat > .env << 'ENVEOF'
DATABASE_URL="file:/var/www/leadcaller/prisma/dev.db"
NEXTAUTH_SECRET="excel-legacy-leadcaller-secret-2026"
NEXTAUTH_URL="https://excellegacyrealtygroup.site/leadcaller"
PORT=3219
NODE_ENV=production
ENVEOF

DATABASE_URL="file:/var/www/leadcaller/prisma/dev.db" npx prisma db push --skip-generate --schema prisma/schema.prisma 2>&1 | tail -2 || true

pm2 delete leadcaller 2>/dev/null || true
PORT=3219 pm2 start server.js --name leadcaller --cwd "$DEPLOY_DIR"
pm2 save

echo "Lead Caller deployed at port 3219 (old build in $BK)"
pm2 list | grep leadcaller

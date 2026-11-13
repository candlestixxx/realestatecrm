#!/bin/bash
# Deploy AI CRM on Hetzner at port 3218 (mounted publicly at /aicrm/)
#
# Nondestructive: old build is moved to a timestamped backup dir instead of
# deleted. Expects /tmp/deploy-aicrm.tar.gz (Next standalone, basePath
# /aicrm - see apps/aicrm/next.config.ts). Build on the server from the
# RealEstateCRMLLC/aicrm repo (npm ci + prisma generate + npm run build,
# package the standalone output), or package locally the same way.
set -e

DEPLOY_DIR=/var/www/aicrm
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

BK=/tmp/aicrm-backup-$(date +%Y%m%d-%H%M%S)
mkdir -p "$BK"
for f in .next server.js package.json node_modules public prisma; do
  [ -e "$f" ] && mv "$f" "$BK/" 2>/dev/null || true
done

tar xzf /tmp/deploy-aicrm.tar.gz

# Prisma schema restore if the tarball lacks it (see deploy-leadg.sh note).
mkdir -p prisma
[ -f prisma/schema.prisma ] || cp "$BK/prisma/schema.prisma" prisma/ 2>/dev/null || true

cat > .env << 'ENVEOF'
DATABASE_URL="file:/var/www/aicrm/prisma/dev.db"
NEXTAUTH_SECRET="excel-legacy-aicrm-secret-2026"
NEXTAUTH_URL="https://excellegacyrealtygroup.site/aicrm"
PORT=3218
NODE_ENV=production
ENVEOF

# Create/update the sqlite schema at the absolute deploy path (never ships
# a local dev.db; the file is created/pushed in place on the server).
DATABASE_URL="file:/var/www/aicrm/prisma/dev.db" npx prisma db push --skip-generate --schema prisma/schema.prisma 2>&1 | tail -2 || true

pm2 delete aicrm 2>/dev/null || true
PORT=3218 pm2 start server.js --name aicrm --cwd "$DEPLOY_DIR"
pm2 save

echo "AI CRM deployed at port 3218 (old build in $BK)"
pm2 list | grep aicrm

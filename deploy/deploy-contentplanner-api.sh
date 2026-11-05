#!/bin/bash
# Deploy ContentPlanner Express API on Hetzner at port 3216
#
# Source-based deploy: npm install on the server fetches Linux binaries
# (Prisma engines), then prisma generate builds the debian client.
# Nondestructive: old deploy moved to /tmp backup. DeepSeek env preserved.
set -e

DEPLOY_DIR=/var/www/contentplanner-api
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

DEEPSEEK_ENV=""
if [ -f .env ]; then
  # Preserve auth + DeepSeek config across redeploys (rewriting .env would
  # silently drop AUTH_JWT_SECRET and break service-token verification).
  DEEPSEEK_ENV=$(grep -E '^(DEEPSEEK|AUTH_JWT_SECRET)' .env || true)
fi

BK=/tmp/contentplanner-api-backup-$(date +%Y%m%d-%H%M%S)
mkdir -p "$BK"
for f in packages package.json package-lock.json node_modules tsconfig.json turbo.json jest.config.js; do
  [ -e "$f" ] && mv "$f" "$BK/" 2>/dev/null || true
done

tar xzf /tmp/deploy-contentplanner-api.tar.gz

# Install deps (fetches Linux Prisma engines + tsx)
npm install --legacy-peer-deps 2>&1 | tail -3

# Build the Prisma client for this platform
npx prisma generate --schema=packages/database/prisma/schema.prisma 2>&1 | tail -2

# Environment — Postgres (shared with the contentplanner web app)
PGPASS=$(cat /root/.contentplanner-pgpass 2>/dev/null || echo '')
if [ -n "$PGPASS" ]; then
  DB_URL="postgresql://contentplanner:$PGPASS@127.0.0.1:5432/contentplanner?schema=public"
else
  echo "ERROR: /root/.contentplanner-pgpass missing — cannot configure DATABASE_URL"
  exit 1
fi

cat > .env << ENVEOF
PORT=3216
NODE_ENV=production
DATABASE_URL="$DB_URL"
NEXT_PUBLIC_APP_URL=https://excellegacyrealtygroup.site
NEXT_PUBLIC_API_URL=https://excellegacyrealtygroup.site/contentplanner-api
$DEEPSEEK_ENV
ENVEOF

mkdir -p prisma

# Create tables in Postgres
npx prisma db push --schema=packages/database/prisma/schema.prisma --skip-generate 2>&1 | tail -2

pm2 delete contentplanner-api 2>/dev/null || true
PORT=3216 pm2 start npx --name contentplanner-api --cwd "$DEPLOY_DIR" -- tsx packages/api/src/server.ts
pm2 save

echo "ContentPlanner API deployed at port 3216 (old deploy in $BK)"
pm2 list | grep contentplanner-api

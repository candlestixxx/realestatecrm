#!/bin/bash
# Deploy LegacyLeads Express API on Hetzner at port 3217
#
# Source-based deploy: npm install + tsc on the server, Postgres role/DB
# provisioned idempotently, migrations applied with psql.
# Nondestructive: old deploy moved to /tmp backup. Integration env preserved.
# Expects /tmp/deploy-legacyleads-api.tar.gz uploaded (see package-legacyleads-api.py).
set -e

DEPLOY_DIR=/var/www/legacyleads-api
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

# Preserve integration env vars across redeploys
PRESERVED_ENV=""
if [ -f .env ]; then
  PRESERVED_ENV=$(grep -E '^(DEEPSEEK|VAPI|TWILIO|SENDGRID|LOB|SKIP_TRACE|BSA|REALCOMP|HEYGEN|DID|MAGNIFIC|CANVA|BROWSERLESS|TAVILY|NEWSAPI|OPENAI)' .env || true)
fi

BK=/tmp/legacyleads-api-backup-$(date +%Y%m%d-%H%M%S)
mkdir -p "$BK"
for f in src dist migrations package.json package-lock.json node_modules tsconfig.json; do
  [ -e "$f" ] && mv "$f" "$BK/" 2>/dev/null || true
done

tar xzf /tmp/deploy-legacyleads-api.tar.gz

# Install deps then compile (devDeps carry typescript)
npm install --legacy-peer-deps 2>&1 | tail -3
npx tsc -p tsconfig.json 2>&1 | tail -3

# --- Postgres role + database (idempotent; password persisted server-side) ---
PGPASS_FILE=/root/.legacyleads-pgpass
if [ -f "$PGPASS_FILE" ]; then
  PGPASS=$(cat "$PGPASS_FILE")
else
  PGPASS=$(openssl rand -hex 24)
  echo -n "$PGPASS" > "$PGPASS_FILE"
  chmod 600 "$PGPASS_FILE"
fi
export PGPASSWORD="$PGPASS"

su postgres -c "psql -v ON_ERROR_STOP=1 -c \"DO \\\$\\\$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'legacyleads') THEN CREATE ROLE legacyleads LOGIN PASSWORD '$PGPASS'; END IF; END \\\$\\\$;\""
su postgres -c "psql -v ON_ERROR_STOP=1 -c \"SELECT 1 FROM pg_database WHERE datname = 'legacyleads'\" | grep -q 1 || createdb -O legacyleads legacyleads"
su postgres -c "psql -d legacyleads -v ON_ERROR_STOP=1 -c 'CREATE EXTENSION IF NOT EXISTS postgis'"
su postgres -c "psql -d legacyleads -v ON_ERROR_STOP=1 -f $DEPLOY_DIR/migrations/01_initial_schema.sql"
su postgres -c "psql -d legacyleads -v ON_ERROR_STOP=1 -f $DEPLOY_DIR/migrations/02_listings_schema.sql"

cat > .env << ENVEOF
PORT=3217
NODE_ENV=production
DATABASE_URL="postgresql://legacyleads:$PGPASS@127.0.0.1:5432/legacyleads"
REDIS_URL="redis://127.0.0.1:6379"
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
$PRESERVED_ENV
ENVEOF

pm2 delete legacyleads-api 2>/dev/null || true
PORT=3217 pm2 start node --name legacyleads-api --cwd "$DEPLOY_DIR" -- dist/src/index.js
pm2 save

echo "LegacyLeads API deployed at port 3217 (old deploy in $BK)"
sleep 5
curl -s -o /dev/null -w "health:%{http_code}\n" http://127.0.0.1:3217/health --max-time 10
curl -s http://127.0.0.1:3217/listings --max-time 10 | head -c 200; echo
pm2 list | grep legacyleads-api

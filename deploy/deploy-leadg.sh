#!/bin/bash
# Deploy LeadG on Hetzner at port 3211
#
# Nondestructive: old build is moved to a timestamped backup dir instead of
# deleted. .env DeepSeek settings are preserved across deploys.
set -e

DEPLOY_DIR=/var/www/leadg
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

# Preserve integration env vars from the previous .env (API key continuity).
# Covers VAPI/DEEPSEEK/TWILIO/SENDGRID/LOB — rewriting .env would otherwise
# silently drop voice + messaging credentials on every deploy.
PRESERVED=""
if [ -f .env ]; then
  PRESERVED=$(grep -E '^(DEEPSEEK|VAPI|TWILIO|SENDGRID|LOB|SKIP_TRACE)' .env || true)
fi

# Move old build aside (backup, never delete)
BK=/tmp/leadg-backup-$(date +%Y%m%d-%H%M%S)
mkdir -p "$BK"
for f in .next standalone server.js middleware.ts static public node_modules prisma; do
  [ -e "$f" ] && mv "$f" "$BK/" 2>/dev/null || true
done

# Extract
tar xzf /tmp/deploy-leadg.tar.gz

# Write .env (re-append preserved DeepSeek config)
cat > .env << ENVEOF
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="excel-legacy-leadg-secret-2026"
NEXTAUTH_URL="https://excellegacyrealtygroup.site/leadg"
PORT=3211
NODE_ENV=production
$PRESERVED
ENVEOF

# Ensure prisma dir exists
mkdir -p prisma

# Start with PM2
pm2 delete leadg 2>/dev/null || true
PORT=3211 pm2 start server.js --name leadg --cwd "$DEPLOY_DIR"
pm2 save

echo "LeadG deployed at port 3211 (old build in $BK)"
pm2 list | grep leadg

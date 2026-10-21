#!/bin/bash
# Deploy Media Workflow backend on Hetzner at port 3214
#
# Nondestructive: old dist moved to backup. DeepSeek env preserved.
set -e

DEPLOY_DIR=/var/www/media-workflow
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

DEEPSEEK_ENV=""
if [ -f .env ]; then
  DEEPSEEK_ENV=$(grep '^DEEPSEEK' .env || true)
fi

BK=/tmp/media-workflow-backup-$(date +%Y%m%d-%H%M%S)
mkdir -p "$BK"
for f in dist node_modules package.json; do
  [ -e "$f" ] && mv "$f" "$BK/" 2>/dev/null || true
done

# Copy the built backend
cp -r /tmp/media-workflow-dist/dist .
cp /tmp/media-workflow-dist/package.json .
npm install --production --legacy-peer-deps 2>&1 | tail -3

cat > .env << ENVEOF
DATABASE_URL="file:./prisma/dev.db"
PORT=3214
NODE_ENV=production
$DEEPSEEK_ENV
ENVEOF

mkdir -p prisma

pm2 delete media-workflow 2>/dev/null || true
PORT=3214 pm2 start dist/src/index.js --name media-workflow --cwd "$DEPLOY_DIR"
pm2 save

echo "Media Workflow deployed at port 3214 (old build in $BK)"
pm2 list | grep media

#!/bin/bash
# Deploy Media Workflow backend on Hetzner at port 3214
set -e

DEPLOY_DIR=/var/www/media-workflow
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

# Copy the built backend
rm -rf dist node_modules package.json
cp -r /tmp/media-workflow-dist/dist .
cp /tmp/media-workflow-dist/package.json .
npm install --production --legacy-peer-deps 2>&1 | tail -3

cat > .env << 'ENVEOF'
DATABASE_URL="file:./prisma/dev.db"
PORT=3214
NODE_ENV=production
ENVEOF

mkdir -p prisma

pm2 delete media-workflow 2>/dev/null || true
PORT=3214 pm2 start dist/src/index.js --name media-workflow --cwd "$DEPLOY_DIR"
pm2 save

echo "Media Workflow deployed at port 3214"
pm2 list | grep media

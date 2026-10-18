#!/bin/bash
# Deploy script for excellegacyrealtygroup — handles Prisma symlink correctly
set -e
DEPLOY_DIR=/var/www/excellegacyrealtygroup
TARBALL=/tmp/deploy-v3.tar.gz

cd "$DEPLOY_DIR"
rm -rf .next node_modules server.js middleware.ts package.json static public post-deploy.sh
tar xzf "$TARBALL"

# Fix Prisma Turbopack symlink (must point to 'client', not 'node_modules/@prisma/client')
ln -sfn client node_modules/@prisma/client-2c3a283f134fdcb6

# Fix DATABASE_URL to absolute path
sed -i 's|file:./dev.db|file:/var/www/excellegacyrealtygroup/prisma/dev.db|g' .env 2>/dev/null

# Restart PM2
pm2 restart excellegacyrealtygroup
sleep 3

# Verify
CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3210/api/auth/session)
echo "Auth session: $CODE"
if [ "$CODE" != "200" ]; then
  echo "ERROR: Auth session not 200!"
  pm2 logs excellegacyrealtygroup --lines 10 --nostream
  exit 1
fi
echo "Deploy successful"

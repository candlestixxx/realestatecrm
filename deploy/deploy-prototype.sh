#!/bin/bash
# Deploy Prototype on Hetzner: Express API on 3012 + Next client on 3221
# (mounted publicly at /prototype/; the client proxies /api to :3012 via its
# next.config rewrite). Client uses basePath /prototype.
#
# Nondestructive: old builds moved to timestamped backup dirs.
# Expects /tmp/deploy-prototype.tar.gz (client standalone) and the API
# build present at /tmp/build-prototype/server (dist + node_modules), or
# adapt API_SRC below to a packaged API tree.
set -e

API_SRC=${API_SRC:-/tmp/build-prototype/server}
CLIENT_TAR=${CLIENT_TAR:-/tmp/deploy-prototype.tar.gz}

# --- API (:3012) ---
mkdir -p /var/www/prototype-api
cd /var/www/prototype-api
BK=/tmp/prototype-api-backup-$(date +%Y%m%d-%H%M%S)
mkdir -p "$BK"
for f in dist node_modules package.json; do
  [ -e "$f" ] && mv "$f" "$BK/" 2>/dev/null || true
done
cp -r "$API_SRC/dist" "$API_SRC/node_modules" "$API_SRC/package.json" .
# Tracked sqlite DB ships with the repo; only seed it if none exists yet.
[ -f database.sqlite ] || cp /tmp/build-prototype/database.sqlite . 2>/dev/null || true
pm2 delete prototype-api 2>/dev/null || true
PORT=3012 pm2 start dist/index.js --name prototype-api --cwd /var/www/prototype-api

# --- Client (:3221, basePath /prototype) ---
mkdir -p /var/www/prototype
cd /var/www/prototype
BK=/tmp/prototype-backup-$(date +%Y%m%d-%H%M%S)
mkdir -p "$BK"
for f in .next server.js package.json node_modules public; do
  [ -e "$f" ] && mv "$f" "$BK/" 2>/dev/null || true
done
tar xzf "$CLIENT_TAR"
pm2 delete prototype 2>/dev/null || true
PORT=3221 pm2 start server.js --name prototype --cwd /var/www/prototype

pm2 save
echo "Prototype deployed (api :3012, client :3221; backups in /tmp/prototype*-backup-*)"
pm2 list | grep prototype

#!/bin/bash
set -e

echo "Deploying Real Estate CRM..."

npm ci --legacy-peer-deps
npx prisma db push
npm run build
pm2 reload excel-legacy-crm || pm2 start npm --name "excel-legacy-crm" -- start

echo "Deployment successful."

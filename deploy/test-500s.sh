#!/bin/bash
echo "=== Testing previously failing endpoints ==="
for path in /api/auth/session /dashboard /workflows/foreclosure-intake /workflows/listing-entry /workflows/offer-draft; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://excellegacyrealtygroup.site${path}" -k)
  echo "${path}: ${code}"
done
echo "=== Prisma symlink check ==="
ls -la /var/www/excellegacyrealtygroup/node_modules/@prisma/client-2c3a283f134fdcb6

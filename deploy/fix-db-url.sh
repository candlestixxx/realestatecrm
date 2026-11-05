#!/bin/bash
# Fix DATABASE_URL in .env to point to the prisma/ subdirectory where tables exist
sed -i 's|file:./dev.db|file:/var/www/excellegacyrealtygroup/prisma/dev.db|g' /var/www/excellegacyrealtygroup/.env
grep DATABASE_URL /var/www/excellegacyrealtygroup/.env
# Restart app to pick up new env
pm2 restart excellegacyrealtygroup
sleep 4
curl -s -o /dev/null -w "Home: %{http_code}\n" https://excellegacyrealtygroup.site/

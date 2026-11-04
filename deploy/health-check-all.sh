#!/bin/bash
echo '=== PM2 STATUS ==='
pm2 list | grep -E 'name|excel|leadg|forec|content|media|legacy|fwber'
echo ''
echo '=== HEALTH CHECKS ==='
for p in 3210 3211 3212 3213 3214 3215; do
  code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$p/ 2>/dev/null)
  echo "Port $p: $code"
done
echo ''
echo '=== NGINX PROXY ==='
for path in / /leadg/ /foreclosure/ /contentplanner/ /media-workflow/ /legacyleads/; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://excellegacyrealtygroup.site$path" 2>/dev/null)
  echo "$path: $code"
done
echo ''
echo '=== MAIN API TESTS ==='
bash /tmp/test-fixes.sh 2>&1
echo ''
echo '=== ERROR LOGS ==='
for svc in excellegacyrealtygroup leadg foreclosure contentplanner media-workflow legacyleads; do
  errors=$(pm2 logs $svc --lines 3 --nostream 2>&1 | grep -i 'error\|fail\|crash' | wc -l)
  echo "$svc: $errors errors"
done

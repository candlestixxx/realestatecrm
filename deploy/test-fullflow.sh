#!/bin/bash
# Full user flow test
rm -f /tmp/ck2.txt

# Get CSRF and login
CSRF=$(curl -s -c /tmp/ck2.txt https://excellegacyrealtygroup.site/api/auth/csrf | python3 -c "import sys,json;print(json.load(sys.stdin)['csrfToken'])")
curl -s -b /tmp/ck2.txt -c /tmp/ck2.txt \
  -X POST "https://excellegacyrealtygroup.site/api/auth/callback/credentials" \
  -d "email=admin@excellegacyrealtygroup.site&password=admin123&csrfToken=$CSRF" \
  -o /dev/null -w "Login:%{http_code}\n"

# Test key pages with session
for path in /dashboard /dashboard/listings /dashboard/leads /dashboard/reports /dashboard/workflows /dashboard/marketing-studio /dashboard/help-center /dashboard/settings; do
  code=$(curl -s -b /tmp/ck2.txt -o /dev/null -w "%{http_code}" "https://excellegacyrealtygroup.site$path")
  echo "  $path -> $code"
done

# Test key API endpoints
for api in /api/leads/latest-unread /api/auth/session /api/leads; do
  code=$(curl -s -b /tmp/ck2.txt -o /dev/null -w "%{http_code}" "https://excellegacyrealtygroup.site$api")
  echo "  $api -> $code"
done

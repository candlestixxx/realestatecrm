#!/bin/bash
# Test the fixed endpoints
rm -f /tmp/ck3.txt

# Login
CSRF=$(curl -s -c /tmp/ck3.txt https://excellegacyrealtygroup.site/api/auth/csrf | python3 -c "import sys,json;print(json.load(sys.stdin)['csrfToken'])")
curl -s -b /tmp/ck3.txt -c /tmp/ck3.txt \
  -X POST "https://excellegacyrealtygroup.site/api/auth/callback/credentials" \
  -d "email=admin@excellegacyrealtygroup.site&password=admin123&csrfToken=$CSRF" -o /dev/null

echo "=== /api/posts ==="
curl -s -b /tmp/ck3.txt -o /dev/null -w "%{http_code}" "https://excellegacyrealtygroup.site/api/posts?status=SCHEDULED"
echo

echo "=== /api/contracts POST ==="
curl -s -b /tmp/ck3.txt -X POST "https://excellegacyrealtygroup.site/api/contracts" \
  -H "Content-Type: application/json" \
  -d '{"template":{"type":"PURCHASE_AGREEMENT"},"parties":[{"role":"buyer","name":"Test","email":"test@test.com"}],"action":"deploy"}' \
  -w "\nHTTP:%{http_code}"
echo

echo "=== /api/chat/rooms ==="
curl -s -b /tmp/ck3.txt -o /dev/null -w "%{http_code}" "https://excellegacyrealtygroup.site/api/chat/rooms"
echo

echo "=== /api/auth/session ==="
curl -s -b /tmp/ck3.txt "https://excellegacyrealtygroup.site/api/auth/session"
echo

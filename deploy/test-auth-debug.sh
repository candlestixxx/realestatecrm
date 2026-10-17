#!/bin/bash
# Debug auth flow step by step
rm -f /tmp/ck.txt

echo "=== 1. CSRF ==="
CSRF=$(curl -s -c /tmp/ck.txt https://excellegacyrealtygroup.site/api/auth/csrf | python3 -c "import sys,json;print(json.load(sys.stdin)['csrfToken'])")
echo "CSRF: $CSRF"

echo "=== 2. Cookies after CSRF ==="
cat /tmp/ck.txt

echo "=== 3. Login (verbose headers) ==="
curl -s -b /tmp/ck.txt -c /tmp/ck.txt \
  -X POST "https://excellegacyrealtygroup.site/api/auth/callback/credentials" \
  -d "email=admin@excellegacyrealtygroup.site&password=admin123&csrfToken=$CSRF" \
  -D /tmp/login-headers.txt \
  -o /tmp/login-body.txt \
  -w "HTTP:%{http_code} redirect:%{redirect_url}"
echo

echo "=== 4. Login response headers ==="
cat /tmp/login-headers.txt

echo "=== 5. Login response body ==="
cat /tmp/login-body.txt
echo

echo "=== 6. Cookies after login ==="
cat /tmp/ck.txt

echo "=== 7. Session with cookies ==="
curl -s -b /tmp/ck.txt https://excellegacyrealtygroup.site/api/auth/session
echo

echo "=== 8. Session response headers ==="
curl -sI -b /tmp/ck.txt https://excellegacyrealtygroup.site/api/auth/session | head -20

#!/bin/bash
# Test login with correct admin credentials
rm -f /tmp/cookies2.txt

# Get CSRF token
CSRF=$(curl -s https://excellegacyrealtygroup.site/api/auth/csrf | python3 -c "import sys,json;print(json.load(sys.stdin)['csrfToken'])")
echo "CSRF: $CSRF"

# Login with correct admin credentials
curl -s -b /tmp/cookies2.txt -c /tmp/cookies2.txt \
  -X POST "https://excellegacyrealtygroup.site/api/auth/callback/credentials" \
  -d "email=admin@excellegacyrealtygroup.site&password=admin123&csrfToken=$CSRF" \
  -w "\nLogin HTTP:%{http_code}" -o /tmp/login2.txt
echo
cat /tmp/login2.txt
echo

# Check session
echo "Session:"
curl -s -b /tmp/cookies2.txt https://excellegacyrealtygroup.site/api/auth/session
echo

# Try dashboard
echo "Dashboard:"
curl -s -b /tmp/cookies2.txt -o /dev/null -w "%{http_code}" https://excellegacyrealtygroup.site/dashboard
echo

# Try homepage with session
echo "Home:"
curl -s -b /tmp/cookies2.txt -o /dev/null -w "%{http_code}" https://excellegacyrealtygroup.site/
echo

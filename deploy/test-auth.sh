#!/bin/bash
cd /tmp
rm -f cookies.txt csrf.txt

# Get CSRF token
CSRF=$(curl -s -c cookies.txt http://localhost:3210/api/auth/csrf -H 'Host: excellegacyrealtygroup.site' | python3 -c 'import sys,json; print(json.load(sys.stdin)["csrfToken"])')
echo "CSRF: $CSRF"

# Login
LOGIN=$(curl -s -b cookies.txt -c cookies.txt -X POST http://localhost:3210/api/auth/callback/credentials \
  -H 'Host: excellegacyrealtygroup.site' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "email=admin%40excellegacyrealtygroup.site&password=admin123&csrfToken=${CSRF}&callbackUrl=https%3A%2F%2Fexcellegacyrealtygroup.site%2Fdashboard&json=true")
echo "Login: $LOGIN"

# Test dashboard
DASH=$(curl -s -b cookies.txt -o /dev/null -w '%{http_code}' http://localhost:3210/dashboard -H 'Host: excellegacyrealtygroup.site')
echo "Dashboard: $DASH"

# Test auth session
SESSION=$(curl -s -b cookies.txt http://localhost:3210/api/auth/session -H 'Host: excellegacyrealtygroup.site')
echo "Session: $SESSION"

# Test home page
HOME=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3210/ -H 'Host: excellegacyrealtygroup.site')
echo "Home: $HOME"

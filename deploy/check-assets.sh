#!/bin/bash
echo "=== CSS URLs in HTML ==="
curl -s https://excellegacyrealtygroup.site/ -k | grep -oE '/_next/static/[^"]+\.css' | head -5
echo "=== JS URLs in HTML ==="
curl -s https://excellegacyrealtygroup.site/ -k | grep -oE '/_next/static/[^"]+\.js' | head -5
echo "=== Font URLs in HTML ==="
curl -s https://excellegacyrealtygroup.site/ -k | grep -oE '/_next/static/[^"]+\.woff2' | head -5
echo "=== Test first CSS ==="
css_path=$(curl -s https://excellegacyrealtygroup.site/ -k | grep -oE '/_next/static/[^"]+\.css' | head -1)
echo "Testing: $css_path"
curl -s -o /dev/null -w '%{http_code}' "https://excellegacyrealtygroup.site${css_path}" -k
echo ""

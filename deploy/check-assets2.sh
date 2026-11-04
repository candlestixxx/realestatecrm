#!/bin/bash
echo "=== Test fonts ==="
curl -s -o /dev/null -w '%{http_code}' "https://excellegacyrealtygroup.site/_next/static/media/797e433ab948586e-s.p.08e28id.o-okb.woff2" -k
echo " (font 1)"
curl -s -o /dev/null -w '%{http_code}' "https://excellegacyrealtygroup.site/_next/static/media/caa3a2e1cccd8315-s.p.09~u27dqhyhd6.woff2" -k
echo " (font 2)"
echo "=== Test JS ==="
curl -s -o /dev/null -w '%{http_code}' "https://excellegacyrealtygroup.site/_next/static/chunks/0ae9w-nr5ni~n.js" -k
echo " (js 1)"
curl -s -o /dev/null -w '%{http_code}' "https://excellegacyrealtygroup.site/_next/static/chunks/0k6c9i47ki3cm.js" -k
echo " (js 2)"
curl -s -o /dev/null -w '%{http_code}' "https://excellegacyrealtygroup.site/_next/static/chunks/turbopack-0ye.gm6wluz_~.js" -k
echo " (turbopack)"
echo "=== Test CSS ==="
curl -s -o /dev/null -w '%{http_code}' "https://excellegacyrealtygroup.site/_next/static/chunks/13wtj8qk4k5l3.css" -k
echo " (css 1)"
curl -s -o /dev/null -w '%{http_code}' "https://excellegacyrealtygroup.site/_next/static/chunks/0sl8wgtjfqts3.css" -k
echo " (css 2)"

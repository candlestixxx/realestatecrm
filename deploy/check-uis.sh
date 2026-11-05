#!/bin/bash
echo "=== Media Workflow UI via nginx ==="
curl -s -o /dev/null -w '%{http_code}' "https://excellegacyrealtygroup.site/media-workflow/" -k
echo " (root)"
curl -s "https://excellegacyrealtygroup.site/media-workflow/" -k | head -5
echo ""
echo "=== Check all sub-service UIs render content ==="
for svc in leadg foreclosure contentplanner legacyleads; do
  size=$(curl -s "https://excellegacyrealtygroup.site/${svc}/" -k | wc -c)
  echo "${svc}: ${size} bytes"
done
echo ""
echo "=== Check Media Workflow root ==="
size=$(curl -s "http://localhost:3214/" | wc -c)
echo "media-workflow: ${size} bytes"

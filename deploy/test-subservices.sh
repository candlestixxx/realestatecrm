#!/bin/bash
for svc in leadg foreclosure contentplanner media-workflow legacyleads; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://excellegacyrealtygroup.site/${svc}/" -k)
  echo "${svc}: ${code}"
done
echo "---"
echo "Main CRM:"
curl -s -o /dev/null -w '%{http_code}' "https://excellegacyrealtygroup.site/" -k
echo ""

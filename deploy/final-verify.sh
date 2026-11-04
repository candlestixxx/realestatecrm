#!/bin/bash
echo "=== All Services Final Verification ==="
echo ""
echo "--- Main CRM ---"
echo -n "Home: "; curl -s -o /dev/null -w '%{http_code}' "https://excellegacyrealtygroup.site/" -k
echo -n " | Auth: "; curl -s -o /dev/null -w '%{http_code}' "https://excellegacyrealtygroup.site/api/auth/session" -k
echo ""
echo "--- Sub-Projects ---"
for svc in leadg foreclosure contentplanner media-workflow legacyleads; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://excellegacyrealtygroup.site/${svc}/" -k)
  echo "${svc}: ${code}"
done
echo ""
echo "--- Goal Statements Deployed ---"
echo -n "Main CRM: "; curl -s "https://excellegacyrealtygroup.site/" -k | grep -c "Unified Platform" 2>/dev/null || echo "0 (client-rendered)"
echo -n "LeadG: "; curl -s "http://localhost:3211/" | grep -c "Voice.*Lead Engine\|VoiceForge" 2>/dev/null || echo "0"
echo -n "Foreclosure: "; curl -s "http://localhost:3212/" | grep -c "Foreclosure Workflow\|Legal Intake" 2>/dev/null || echo "0"
echo -n "ContentPlanner: "; curl -s "http://localhost:3213/" | grep -c "Content Planner\|Social Media" 2>/dev/null || echo "0"
echo -n "MediaWorkflow: "; curl -s "http://localhost:3214/" | grep -c "Photo/Video Pipeline\|Media Workflow" 2>/dev/null || echo "0 (JS-rendered)"
echo -n "LegacyLeads: "; curl -s "http://localhost:3215/" | grep -c "LegacyLeads\|Property Data\|Skip Tracing" 2>/dev/null || echo "0"
echo ""
echo "--- Prisma ---"
ls -la /var/www/excellegacyrealtygroup/node_modules/@prisma/client-2c3a283f134fdcb6
echo ""
echo "--- PM2 Status ---"
pm2 list | grep -E 'excellegacy|leadg|foreclosure|contentplanner|media-workflow|legacyleads' | awk '{print $4, $12, $18}'

#!/bin/bash
# Add LeadG proxy to nginx config
NGINX_CONF=/etc/nginx/sites-available/excellegacyrealtygroup.site

# Add /leadg/ location block before the closing brace of the server block
# First check if it already exists
if grep -q "location /leadg/" "$NGINX_CONF"; then
    echo "LeadG nginx location already exists"
else
    # Insert before the last closing brace of the server block
    # We'll add it after the /api/ location block
    sed -i '/location \/api\/ {/i\
    location /leadg/ {\
        proxy_pass http://127.0.0.1:3211/;\
        proxy_http_version 1.1;\
        proxy_set_header Upgrade $http_upgrade;\
        proxy_set_header Connection "upgrade";\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
        proxy_read_timeout 86400;\
    }\
' "$NGINX_CONF"
    echo "LeadG nginx location added"
fi

nginx -t && systemctl reload nginx
echo "Nginx reloaded"

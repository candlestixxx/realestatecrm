#!/bin/bash
# Add LegacyLeads proxy to nginx config
NGINX_CONF=/etc/nginx/sites-available/excellegacyrealtygroup.site

if grep -q "location /legacyleads/" "$NGINX_CONF"; then
    echo "LegacyLeads nginx location already exists"
else
    sed -i '/location \/media-workflow\/ {/i\
    location /legacyleads/ {\
        proxy_pass http://127.0.0.1:3215/;\
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
    echo "LegacyLeads nginx location added"
fi

nginx -t 2>&1 | tail -2 && systemctl reload nginx
echo "Nginx reloaded"

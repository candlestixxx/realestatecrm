#!/bin/bash
# Add Media Workflow proxy to nginx config
NGINX_CONF=/etc/nginx/sites-available/excellegacyrealtygroup.site

if grep -q "location /media-workflow/" "$NGINX_CONF"; then
    echo "Media Workflow nginx location already exists"
else
    sed -i '/location \/contentplanner\/ {/i\
    location /media-workflow/ {\
        proxy_pass http://127.0.0.1:3214/;\
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
    echo "Media Workflow nginx location added"
fi

nginx -t 2>&1 | tail -2 && systemctl reload nginx
echo "Nginx reloaded"

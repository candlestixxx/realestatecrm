#!/bin/bash
# Add all sub-service proxy locations to nginx config
NGINX_CONF=/etc/nginx/sites-available/excellegacyrealtygroup.site

# Check if leadg already exists
if grep -q "location /leadg/" "$NGINX_CONF"; then
    echo "Sub-service locations already exist"
else
    # Create new config with all sub-service locations
    cat > /tmp/nginx-subsites.conf << 'NGINXEOF'
    # Sub-services
    location /leadg/ {
        proxy_pass http://127.0.0.1:3211/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
    location /foreclosure/ {
        proxy_pass http://127.0.0.1:3212/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
    location /contentplanner/ {
        proxy_pass http://127.0.0.1:3213/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
    location /media-workflow/ {
        proxy_pass http://127.0.0.1:3214/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
    location /legacyleads/ {
        proxy_pass http://127.0.0.1:3215/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

NGINXEOF

    # Insert before "location / {"
    sed -i '/location \/ {/e cat /tmp/nginx-subsites.conf' "$NGINX_CONF"
    echo "Sub-service locations added"
fi

nginx -t && systemctl reload nginx
echo "Nginx reloaded"

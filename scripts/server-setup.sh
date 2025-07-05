#!/bin/bash

# Server Setup Script for Bodo
# Run this script on your server to prepare it for deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Setting up server for Bodo deployment...${NC}"

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
echo -e "${YELLOW}📦 Installing Node.js 18.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
echo -e "${YELLOW}📦 Installing PM2...${NC}"
sudo npm install -g pm2

# Install nginx
echo -e "${YELLOW}📦 Installing nginx...${NC}"
sudo apt install -y nginx

# Create application directory
echo -e "${YELLOW}📁 Creating application directory...${NC}"
mkdir -p $HOME/bodo
# Directory ownership not needed for home directory

# Create log directory
echo -e "${YELLOW}📁 Creating log directory...${NC}"
sudo mkdir -p /var/log/bodo
sudo chown $USER:$USER /var/log/bodo

# Setup nginx configuration
echo -e "${YELLOW}🔧 Setting up nginx configuration...${NC}"
sudo tee /etc/nginx/sites-available/bodo << EOF
server {
    listen 80;
    server_name 154.42.7.63;  # Replace with your domain

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/bodo /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Start nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Reload nginx to apply configuration
sudo systemctl reload nginx

# Setup firewall (if ufw is available)
if command -v ufw &> /dev/null; then
    echo -e "${YELLOW}🔥 Setting up firewall...${NC}"
    sudo ufw allow ssh
    sudo ufw allow 'Nginx Full'
    sudo ufw --force enable
fi

echo -e "${GREEN}✅ Server setup completed!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "${YELLOW}1. Update the nginx configuration with your domain${NC}"
echo -e "${YELLOW}2. Run the deployment script: ./scripts/deploy.sh${NC}"
echo -e "${YELLOW}3. Set up SSL with Let's Encrypt if needed${NC}" 
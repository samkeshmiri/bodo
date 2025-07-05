#!/bin/bash

# Bodo Deployment Script
# This script handles the deployment of the Bodo application

set -e

# Configuration
APP_NAME="bodo-app"
APP_DIR="$HOME/bodo"
GIT_REPO="https://github.com/yourusername/bodo.git"  # Update with your repo URL
BRANCH="main"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Bodo deployment...${NC}"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}❌ Please don't run this script as root${NC}"
    exit 1
fi

# Create app directory if it doesn't exist
if [ ! -d "$APP_DIR" ]; then
    echo -e "${YELLOW}📁 Creating application directory...${NC}"
    sudo mkdir -p "$APP_DIR"
    sudo chown $USER:$USER "$APP_DIR"
fi

# Navigate to app directory
cd "$APP_DIR"

# Check if git repository exists
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}📥 Cloning repository...${NC}"
    git clone -b "$BRANCH" "$GIT_REPO" .
else
    echo -e "${YELLOW}📥 Pulling latest changes...${NC}"
    git fetch origin
    git reset --hard origin/$BRANCH
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci

# Generate Prisma client
echo -e "${YELLOW}🔧 Generating Prisma client...${NC}"
npm run db:generate

# Build the application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}📦 Installing PM2...${NC}"
    npm install -g pm2
fi

# Start or restart the application
echo -e "${YELLOW}🚀 Starting application with PM2...${NC}"
if pm2 list | grep -q "$APP_NAME"; then
    pm2 restart "$APP_NAME"
    echo -e "${GREEN}✅ Application restarted successfully${NC}"
else
    pm2 start npm --name "$APP_NAME" -- start
    echo -e "${GREEN}✅ Application started successfully${NC}"
fi

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# Reload nginx to ensure configuration is applied
echo -e "${YELLOW}🔄 Reloading nginx...${NC}"
sudo systemctl reload nginx

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${YELLOW}📊 Check application status: pm2 status${NC}"
echo -e "${YELLOW}📋 View logs: pm2 logs $APP_NAME${NC}"
echo -e "${YELLOW}🌐 Your app should be available at: http://154.42.7.63${NC}" 
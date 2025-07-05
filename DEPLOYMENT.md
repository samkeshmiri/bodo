# Bodo Deployment Guide

This guide explains how to set up automatic deployment of the Bodo application using GitHub Actions.

## Overview

The deployment system consists of:
- **GitHub Actions Workflow**: Automatically deploys when you push to `main` or `deployment-setup` branches
- **Server Setup**: Prepares your server for hosting the application
- **PM2 Process Manager**: Manages the Node.js application on the server

## Prerequisites

1. A server with Ubuntu/Debian (VPS or cloud instance)
2. SSH access to your server
3. GitHub repository with your code
4. All required environment variables

## Server Setup

### 1. Initial Server Preparation

SSH into your server and run the setup script:

```bash
# Clone your repository
git clone https://github.com/yourusername/bodo.git
cd bodo

# Make scripts executable
chmod +x scripts/server-setup.sh
chmod +x scripts/deploy.sh

# Run server setup
./scripts/server-setup.sh
```

### 2. Configure Your Domain

Edit the nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/bodo
```

Replace `your-domain.com` with your actual domain name.

### 3. Set Up Environment Variables

Create a `.env` file on your server:

```bash
cd /var/www/bodo
nano .env
```

Add all your environment variables:

```env
DATABASE_URL=your_database_url
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret
NEXT_PUBLIC_RPC_URL=your_rpc_url
ESCROW_WALLET_PRIVATE_KEY=your_private_key
ESCROW_WALLET_ADDRESS=your_wallet_address

# Note: The escrow service is currently simulated for demo purposes.
# No actual blockchain transactions are executed.
```

## GitHub Actions Setup

### 1. Add Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add these secrets:

- `SERVER_HOST`: Your server's IP address or domain
- `SERVER_USERNAME`: SSH username (usually `root` or your user)
- `SERVER_SSH_KEY`: Your private SSH key (the entire key content)
- `SERVER_PORT`: SSH port (usually `22`)
- `DATABASE_URL`: Your database connection string
- `PRIVY_APP_ID`: Your Privy app ID
- `PRIVY_APP_SECRET`: Your Privy app secret
- `STRAVA_CLIENT_ID`: Your Strava client ID
- `STRAVA_CLIENT_SECRET`: Your Strava client secret
- `NEXT_PUBLIC_RPC_URL`: Your blockchain RPC URL (optional for simulation mode)
- `ESCROW_WALLET_PRIVATE_KEY`: Your escrow wallet private key (optional for simulation mode)
- `ESCROW_WALLET_ADDRESS`: Your escrow wallet address (optional for simulation mode)

**Note**: The escrow service is currently simulated for demo purposes. No actual blockchain transactions are executed.

### 2. SSH Key Setup

Generate an SSH key pair for GitHub Actions:

```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -C "github-actions@yourdomain.com"
```

Add the public key to your server's `~/.ssh/authorized_keys`:

```bash
# On your server
echo "your_public_key_content" >> ~/.ssh/authorized_keys
```

Add the private key content to GitHub Secrets as `SERVER_SSH_KEY`.

### 3. Update Repository URL

Edit `scripts/deploy.sh` and update the `GIT_REPO` variable with your actual repository URL.

## Deployment Process

### Manual Deployment

To deploy manually on your server:

```bash
cd /var/www/bodo
./scripts/deploy.sh
```

### Automatic Deployment

The GitHub Actions workflow will automatically:

1. Build the application
2. Test the build
3. SSH into your server
4. Pull the latest code
5. Install dependencies
6. Generate Prisma client
7. Build the application
8. Restart the PM2 process

## Monitoring

### Check Application Status

```bash
pm2 status
pm2 logs bodo-app
```

### View Nginx Logs

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Application Logs

```bash
tail -f /var/log/bodo/combined.log
```

## SSL Setup (Optional)

To enable HTTPS, install Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Troubleshooting

### Build Failures

If the build fails in GitHub Actions:

1. Check the build logs in the Actions tab
2. Ensure all environment variables are set correctly
3. Verify the build works locally: `npm run build`

### Deployment Issues

If deployment fails:

1. Check SSH connectivity: `ssh user@your-server`
2. Verify the deployment directory exists: `/var/www/bodo`
3. Check PM2 status: `pm2 status`
4. View application logs: `pm2 logs bodo-app`

### Server Issues

If the server setup fails:

1. Ensure you have sudo privileges
2. Check internet connectivity
3. Verify the Ubuntu/Debian system
4. Check available disk space

## Security Considerations

1. **Firewall**: The setup script configures UFW firewall
2. **SSH Keys**: Use SSH keys instead of passwords
3. **Environment Variables**: Never commit sensitive data to the repository
4. **Regular Updates**: Keep your server updated
5. **Backups**: Set up regular backups of your database and application

## Performance Optimization

1. **PM2 Clustering**: For high traffic, consider using PM2 clusters
2. **Nginx Caching**: Configure nginx caching for static assets
3. **Database Optimization**: Ensure proper database indexing
4. **CDN**: Consider using a CDN for static assets

## Support

For deployment issues:

1. Check the GitHub Actions logs
2. Review server logs
3. Verify environment variables
4. Test the build locally first 
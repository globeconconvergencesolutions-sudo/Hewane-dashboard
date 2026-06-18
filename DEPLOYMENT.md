# Deployment Guide - Hewane Music Dashboard

## Pre-Deployment Checklist

### 1. Infrastructure Setup
- [ ] Contabo VPS provisioned (Ubuntu 22.04 LTS recommended)
- [ ] SSH access configured
- [ ] Firewall rules opened (ports 80, 443)
- [ ] Cloudflare DNS pointing to VPS IP
- [ ] SSL certificate configured (Cloudflare free tier)

### 2. Server Configuration
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### 3. Project Setup
```bash
# Clone repository
git clone https://github.com/your-org/hewane-dashboard.git
cd hewane-dashboard

# Create .env file with production values
cp .env.example .env.production
# Edit .env.production with actual values
nano .env.production
```

### 4. Required Environment Variables
```bash
# n8n Configuration
N8N_WORKFLOW_A_URL=https://n8n.hewaneschoolofmusic.com/webhook/hewane-sheets-sync
N8N_WORKFLOW_B_URL=https://n8n.hewaneschoolofmusic.com/webhook/hewane-broadcast-trigger
N8N_BASE_URL=https://n8n.hewaneschoolofmusic.com
N8N_API_KEY=<from n8n Settings → API>

# Google Sheets
GOOGLE_SHEETS_ID=<from Google Sheet URL>
GOOGLE_SERVICE_ACCOUNT_EMAIL=hewane@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----

# NextAuth
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://dashboard.hewaneschoolofmusic.com

# Admin Credentials (password must be bcrypt hashed)
ADMIN_EMAIL=admin@hewaneschoolofmusic.com
ADMIN_PASSWORD_HASH=$(npx bcryptjs-cli hash "your-password")
```

## Deployment Steps

### Step 1: Build Docker Image
```bash
docker build -t hewane-dashboard:latest .
docker tag hewane-dashboard:latest hewane-dashboard:$(date +%Y%m%d)
```

### Step 2: Run with Docker Compose
```bash
# With environment variables file
docker-compose --env-file .env.production up -d

# Or manually with environment variables
docker run -d \
  --name hewane-dashboard \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env.production \
  hewane-dashboard:latest
```

### Step 3: Configure Nginx Reverse Proxy
```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/dashboard.hewaneschoolofmusic.com
```

**Nginx Configuration:**
```nginx
upstream dashboard {
    server localhost:3000;
}

server {
    listen 80;
    server_name dashboard.hewaneschoolofmusic.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dashboard.hewaneschoolofmusic.com;

    # SSL certificates (use Cloudflare origin certificates)
    ssl_certificate /etc/ssl/certs/cloudflare.crt;
    ssl_certificate_key /etc/ssl/private/cloudflare.key;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://dashboard;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/dashboard.hewaneschoolofmusic.com \
    /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 4: Verify Deployment
```bash
# Check container status
docker ps | grep hewane-dashboard

# View logs
docker logs -f hewane-dashboard

# Test dashboard
curl -I https://dashboard.hewaneschoolofmusic.com

# Login test
curl -X POST https://dashboard.hewaneschoolofmusic.com/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hewaneschoolofmusic.com","password":"your-password"}'
```

## Post-Deployment

### Monitoring
```bash
# Set up log rotation
sudo nano /etc/logrotate.d/hewane-dashboard
```

```
/var/log/hewane-dashboard/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        docker exec hewane-dashboard kill -USR1 1 > /dev/null 2>&1 || true
    endscript
}
```

### Backup Strategy
```bash
# Daily Google Sheets backup
0 2 * * * /home/ubuntu/scripts/backup-sheets.sh

# Container backup (optional)
0 3 * * 0 docker save hewane-dashboard:latest | gzip > /backups/dashboard-$(date +%Y%m%d).tar.gz
```

### Auto-Restart on Failure
```bash
# Already configured in docker-compose.yml with restart: unless-stopped
# Alternatively, use systemd service

sudo nano /etc/systemd/system/hewane-dashboard.service
```

```ini
[Unit]
Description=Hewane Music Dashboard
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
ExecStart=/usr/bin/docker-compose -f /home/ubuntu/hewane-dashboard/docker-compose.yml up -d
Restart=always
RestartSec=10s

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable hewane-dashboard.service
sudo systemctl start hewane-dashboard.service
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs hewane-dashboard

# Verify environment variables
docker inspect hewane-dashboard | grep -A 50 Env

# Check port conflicts
sudo netstat -tuln | grep 3000
```

### High Memory Usage
```bash
# Check container stats
docker stats hewane-dashboard

# Restart container
docker restart hewane-dashboard
```

### Nginx Errors
```bash
# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Verify SSL certificates
sudo openssl x509 -in /etc/ssl/certs/cloudflare.crt -text -noout
```

## Rollback Procedure

### If Deployment Fails
```bash
# Stop current container
docker stop hewane-dashboard

# Restore previous version
docker run -d \
  --name hewane-dashboard \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env.production \
  hewane-dashboard:$(date -d "yesterday" +%Y%m%d)

# Verify running
docker ps
```

## Production Checklist

- [x] Docker image built and tagged
- [ ] Environment variables configured
- [ ] Nginx reverse proxy configured
- [ ] SSL certificates installed
- [ ] Health checks passing
- [ ] Backup scripts scheduled
- [ ] Monitoring alerts configured
- [ ] Staff access credentials provided
- [ ] Documentation shared with team
- [ ] Support contact established

## Support & Escalation

**For technical issues:**
1. Check container logs: `docker logs hewane-dashboard`
2. Review environment variables
3. Check network connectivity to n8n and Google Sheets
4. Restart container if needed

**Contact:** admin@hewaneschoolofmusic.com

---

**Deployed:** [Deployment Date]
**Version:** 1.0.0
**Deployed By:** [Your Name]

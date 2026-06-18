# Next Steps - Getting Your Dashboard Live

Now that the dashboard is built, follow these steps to deploy it to production on your Contabo VPS.

## Prerequisites Checklist

Before deploying, ensure you have:

- [ ] Contabo VPS with SSH access
- [ ] Domain name (e.g., dashboard.hewane.com)
- [ ] Google Cloud project with Sheets API enabled
- [ ] Service account credentials for Google Sheets
- [ ] Twilio account with WhatsApp Business setup
- [ ] n8n instance (self-hosted or cloud)
- [ ] Cloudflare account for DNS/SSL

---

## Step 1: Prepare Your Contabo VPS (30 minutes)

### 1.1 SSH into your VPS

```bash
ssh root@your-vps-ip
```

### 1.2 Update system packages

```bash
apt update && apt upgrade -y
```

### 1.3 Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 1.4 Install Nginx

```bash
apt install -y nginx
```

### 1.5 Create application directory

```bash
mkdir -p /app/hewane-dashboard
cd /app/hewane-dashboard
```

---

## Step 2: Setup Google Sheets (20 minutes)

### 2.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project called "Hewane Dashboard"
3. Enable the Google Sheets API

### 2.2 Create Service Account

1. In Google Cloud Console, go to **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Name it `hewane-dashboard-service`
4. Click **Create and Continue**
5. Grant it **Editor** role
6. Click **Create Key** → **JSON**
7. Save the key file as `service-account-key.json`

### 2.3 Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet called "Hewane Dashboard Data"
3. Share it with the service account email (from the JSON key)
4. Create 4 tabs with the following headers:

**Tab 1: Contacts**
```
Email | Phone | Name | Segment | Added
```

**Tab 2: Analytics**
```
CampaignID | Name | Date | Sent | Delivered | Failed | SuccessRate
```

**Tab 3: SyncLog**
```
Timestamp | Action | Status | RecordCount
```

**Tab 4: Templates**
```
ID | Name | Body | Variables | Created
```

5. Copy the spreadsheet ID from the URL (long string between `/d/` and `/edit`)

---

## Step 3: Setup n8n Workflows (45 minutes)

### 3.1 Access your n8n instance

```
https://your-n8n-domain.com
```

### 3.2 Create Workflow A: Contact Sync

1. Create new workflow
2. Add trigger: **Webhook**
   - URL: `https://your-domain.com/api/sync`
   - HTTP Method: POST
3. Add action: **Google Sheets** → Update rows
   - Configure with your service account credentials
   - Map contact fields to Contacts tab
4. Add action: **Google Sheets** → Create row (for SyncLog)
5. Save and activate webhook

### 3.3 Create Workflow B: Broadcast Campaign

1. Create new workflow
2. Add trigger: **Webhook**
   - URL: `https://your-domain.com/api/broadcast/start`
   - HTTP Method: POST
3. Add action: **Google Sheets** → Read rows (Contacts tab)
   - Filter by segment
4. Add action: **Twilio** → Send WhatsApp message
   - Loop through contacts
   - Send message via your WhatsApp Business Number
5. Add action: **Google Sheets** → Update rows (Analytics tab)
   - Log delivery status
6. Save and activate webhook

### 3.4 Get n8n Webhook URL and API Key

1. In n8n settings, get your webhook base URL
2. Generate API key in Settings → API
3. Save these values for `.env`

---

## Step 4: Configure Environment Variables (10 minutes)

### 4.1 On your VPS, create .env file

```bash
cd /app/hewane-dashboard
nano .env
```

### 4.2 Add all required variables

```env
# Next.js & Auth
NEXTAUTH_URL=https://dashboard.hewane.com
NEXTAUTH_SECRET=<generate: openssl rand -base64 32>

# Google Sheets
GOOGLE_SHEETS_ID=<your-spreadsheet-id>
GOOGLE_SERVICE_ACCOUNT_EMAIL=<from-service-account-key.json>
GOOGLE_PRIVATE_KEY=<base64-encode-the-private-key-from-json>

# n8n Integration
N8N_WEBHOOK_URL=https://your-n8n-domain.com/webhook
N8N_API_KEY=<your-n8n-api-key>

# Twilio (for WhatsApp)
TWILIO_ACCOUNT_SID=<your-twilio-sid>
TWILIO_AUTH_TOKEN=<your-twilio-token>
TWILIO_WHATSAPP_NUMBER=whatsapp:+254712345678
```

### 4.3 Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Copy output into NEXTAUTH_SECRET

### 4.4 Encode Google Private Key

```bash
# Extract private_key from service-account-key.json
cat service-account-key.json | jq -r '.private_key' | base64
```

Copy output into GOOGLE_PRIVATE_KEY

---

## Step 5: Deploy Docker Container (20 minutes)

### 5.1 Copy project to VPS

```bash
# On your local machine
scp -r /path/to/hewane-dashboard root@your-vps-ip:/app/
```

### 5.2 Build Docker image

```bash
cd /app/hewane-dashboard
docker build -t hewane-dashboard:latest .
```

### 5.3 Create docker-compose override for production

```bash
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  app:
    image: hewane-dashboard:latest
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      NEXTAUTH_URL: https://dashboard.hewane.com
      # All env vars from .env file
    restart: always
    networks:
      - app-network

  nginx:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    networks:
      - app-network
    restart: always

networks:
  app-network:
    driver: bridge
EOF
```

### 5.4 Start containers

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 5.5 Verify services are running

```bash
docker-compose -f docker-compose.prod.yml ps
curl http://localhost:3000/login
```

---

## Step 6: Configure Nginx & SSL (30 minutes)

### 6.1 Create Nginx configuration

```bash
cat > /etc/nginx/sites-available/hewane-dashboard << 'EOF'
server {
    listen 80;
    server_name dashboard.hewane.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dashboard.hewane.com;

    # SSL certificates (from Cloudflare or Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/hewane.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hewane.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
```

### 6.2 Enable the site

```bash
ln -s /etc/nginx/sites-available/hewane-dashboard /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 6.3 Setup SSL with Let's Encrypt (or Cloudflare)

```bash
# Using Certbot
apt install -y certbot python3-certbot-nginx
certbot certonly --standalone -d dashboard.hewane.com
```

### 6.4 Setup DNS with Cloudflare

1. Go to [Cloudflare](https://www.cloudflare.com/)
2. Add your domain
3. Update DNS records to point to your VPS IP:
   - Type: A
   - Name: dashboard
   - IPv4 Address: your-vps-ip
4. Enable SSL/TLS (Flexible or Full)

---

## Step 7: Verify Everything Works (15 minutes)

### 7.1 Test login page

```bash
curl https://dashboard.hewane.com/login
```

### 7.2 Test API endpoint

```bash
curl https://dashboard.hewane.com/api/stats \
  -H "Cookie: next-auth.session-token=..."
```

### 7.3 Test Google Sheets connection

In the dashboard, go to **Contacts** → **Sync Contacts**
- Should sync test data to your Google Sheet

### 7.4 Test n8n webhooks

In the dashboard, try **Broadcast** → **Start Broadcast**
- n8n should receive the webhook

### 7.5 Test WhatsApp delivery

Send a test broadcast to a contact
- Check Twilio logs for delivery status
- Verify message appears in Analytics

---

## Step 8: Setup Monitoring & Backups (20 minutes)

### 8.1 Setup PM2 for process management

```bash
npm install -g pm2

# Create ecosystem.config.js
cat > /app/hewane-dashboard/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: "hewane-dashboard",
    script: "./node_modules/next/dist/bin/next",
    args: "start",
    instances: 2,
    exec_mode: "cluster",
    env: { NODE_ENV: "production" }
  }]
};
EOF

pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 8.2 Setup log rotation

```bash
cat > /etc/logrotate.d/hewane-dashboard << 'EOF'
/var/log/hewane-dashboard/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
}
EOF
```

### 8.3 Setup automated backups

```bash
# Daily backup of Google Sheets to CSV
cat > /usr/local/bin/backup-sheets.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y-%m-%d)
curl -o /backups/contacts-$DATE.csv \
  "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv&gid=0"
EOF

chmod +x /usr/local/bin/backup-sheets.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-sheets.sh") | crontab -
```

### 8.4 Setup error tracking (optional)

```bash
# Install Sentry
npm install @sentry/nextjs

# Configure in next.config.mjs
```

---

## Step 9: Create Administrator Account (5 minutes)

### 9.1 Access admin panel

1. Go to `https://dashboard.hewane.com/login`
2. Default login: `admin@hewaneschoolofmusic.com` / `password123`
3. Go to **Settings** → Change password immediately

### 9.2 Create additional admin accounts (optional)

In Google Sheets **Contacts** tab, add admin users with segment "Admin"

---

## Step 10: Launch & Monitor (Ongoing)

### 10.1 Go live

1. Announce to your team: `https://dashboard.hewane.com`
2. Have admins login and change their default passwords
3. Start importing contacts

### 10.2 Monitor performance

```bash
# Check container logs
docker-compose -f docker-compose.prod.yml logs -f app

# Monitor resource usage
docker stats

# Check Nginx logs
tail -f /var/log/nginx/error.log
```

### 10.3 Common troubleshooting

**Login not working?**
- Check NEXTAUTH_SECRET in .env
- Verify NEXTAUTH_URL matches your domain

**Google Sheets not syncing?**
- Verify service account has Editor access
- Check GOOGLE_SHEETS_ID is correct
- Review logs: `docker-compose logs app`

**WhatsApp not sending?**
- Verify Twilio credentials
- Check n8n webhook is accessible
- Test n8n workflow manually

**Domain not working?**
- Verify DNS records in Cloudflare
- Check SSL certificate is valid
- Test: `curl -v https://dashboard.hewane.com`

---

## Estimated Timeline

| Step | Task | Time |
|------|------|------|
| 1 | VPS Setup | 30 min |
| 2 | Google Sheets | 20 min |
| 3 | n8n Workflows | 45 min |
| 4 | Environment Setup | 10 min |
| 5 | Docker Deploy | 20 min |
| 6 | Nginx & SSL | 30 min |
| 7 | Verification | 15 min |
| 8 | Monitoring | 20 min |
| 9 | Admin Setup | 5 min |
| 10 | Launch | 30 min |
| **Total** | | **3-4 hours** |

---

## Support Resources

- **README.md** - Feature overview and setup
- **API_DOCUMENTATION.md** - All endpoints explained
- **DEPLOYMENT.md** - Detailed deployment guide
- **SECURITY.md** - Security best practices
- **Docker Logs** - `docker-compose logs app`
- **Nginx Logs** - `/var/log/nginx/error.log`
- **n8n Logs** - Available in n8n dashboard

---

## After Launch Checklist

- [ ] All team members can login
- [ ] Contacts can be imported and synced
- [ ] Test broadcast sends successfully
- [ ] Analytics page shows data
- [ ] SSL certificate is valid
- [ ] Automated backups are running
- [ ] Monitoring is setup
- [ ] Team trained on usage

---

**Questions?** Review the documentation files or check the logs for detailed error messages.

**Ready to deploy?** Start with Step 1!

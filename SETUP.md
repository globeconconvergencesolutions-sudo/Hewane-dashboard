# Hewane Music Dashboard - Quick Start Setup Guide

## Phase 1: Infrastructure Setup (Your Responsibility)

Before running the dashboard, you need to set up the following on your Contabo VPS:

### 1.1 n8n Installation

```bash
# SSH into your Contabo VPS
ssh root@your-vps-ip

# Install Docker & Docker Compose (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Create n8n directory
mkdir -p /opt/n8n
cd /opt/n8n

# Create docker-compose.yml for n8n
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  n8n:
    image: n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=n8n.yourdomain.com
      - N8N_PROTOCOL=https
      - N8N_SECURE_COOKIE=true
      - N8N_WEBHOOK_TUNNEL_URL=https://n8n.yourdomain.com/
    volumes:
      - n8n_data:/home/node/.n8n
volumes:
  n8n_data:
EOF

# Start n8n
docker-compose up -d

# Access at: https://n8n.yourdomain.com
```

### 1.2 Google Sheets Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project: "Hewane Dashboard"
3. Enable APIs:
   - Google Sheets API
   - Google Drive API
4. Create Service Account:
   - Go to Service Accounts
   - Create new service account: `hewane-dashboard@project-id.iam.gserviceaccount.com`
   - Create JSON key (download and save securely)
5. Create Google Sheet:
   - Title: "Hewane Dashboard"
   - Create tabs: Contacts, Analytics, SyncLog, Templates
   - Share with service account email
6. Save spreadsheet ID from URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`

### 1.3 Google Sheets Schema

**Tab 1: Contacts**
```
Headers: Email | Phone | Name | Segment | DateAdded | LastMessaged | Status
```

**Tab 2: Analytics**
```
Headers: CampaignID | CampaignName | Date | ContactGroup | TotalSent | Delivered | Failed | SuccessRate
```

**Tab 3: SyncLog**
```
Headers: Timestamp | Action | Status | RecordCount | ErrorMessage
```

**Tab 4: Templates**
```
Headers: ID | Name | Body | Variables | CreatedAt | UsageCount
```

### 1.4 n8n Workflow A: Contact Sync

**Trigger Setup:**
1. Create new workflow in n8n
2. Add "Webhook" trigger node
3. Set Webhook URL: `https://your-domain.com/api/sync`
4. HTTP method: POST

**Workflow Steps:**
```
1. Webhook Trigger
   ↓
2. Receive contacts from Dashboard API
   ↓
3. Validate contact data (email, phone format)
   ↓
4. Google Sheets: Upsert into "Contacts" tab
   ↓
5. Google Sheets: Update "SyncLog" with status
   ↓
6. Return JSON response to Dashboard
```

**Response Format:**
```json
{
  "syncId": "sync_12345",
  "status": "completed",
  "recordsProcessed": 150,
  "recordsCreated": 50,
  "recordsUpdated": 100,
  "errors": 0
}
```

### 1.5 n8n Workflow B: WhatsApp Broadcast

**Trigger Setup:**
1. Create new workflow in n8n
2. Add "Webhook" trigger node
3. Set Webhook URL: `https://your-domain.com/api/broadcast/start`
4. HTTP method: POST

**Workflow Steps:**
```
1. Webhook Trigger (receives campaign data)
   ↓
2. Google Sheets: Read from "Contacts" tab (filtered by segment)
   ↓
3. Loop through contacts
   ↓
4. Twilio/WhatsApp API: Send message to each phone
   ↓
5. Log delivery status
   ↓
6. Google Sheets: Update "Analytics" tab
   ↓
7. Return campaign tracking data
```

**Pause/Stop Webhooks:**
- `https://your-domain.com/api/broadcast/pause` - Pause campaign execution
- `https://your-domain.com/api/broadcast/stop` - Stop and finalize campaign

### 1.6 Cloudflare SSL Setup

1. Add your domain to Cloudflare
2. Enable SSL/TLS: Full (Strict)
3. Create DNS records:
   - `dashboard.hewane.com` → VPS IP
   - `n8n.hewane.com` → VPS IP
4. Enable auto-renew for certificates

### 1.7 Nginx Configuration

```bash
# Install Nginx
apt-get update && apt-get install -y nginx

# Create config for Dashboard
cat > /etc/nginx/sites-available/dashboard << 'EOF'
server {
    listen 443 ssl;
    server_name dashboard.hewane.com;

    ssl_certificate /etc/letsencrypt/live/hewane.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hewane.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name dashboard.hewane.com;
    return 301 https://$server_name$request_uri;
}
EOF

# Enable config
ln -s /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

## Phase 2: Dashboard Setup (Next.js App)

### 2.1 Clone & Install

```bash
# Clone repository
git clone <your-repo-url>
cd hewane-dashboard

# Install dependencies
pnpm install
```

### 2.2 Environment Configuration

```bash
# Create .env.local
cat > .env.local << 'EOF'
# NextAuth Configuration
NEXTAUTH_URL=https://dashboard.hewane.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Google Sheets API
GOOGLE_SHEETS_PRIVATE_KEY=<from-service-account-json>
GOOGLE_SHEETS_CLIENT_EMAIL=<service-account-email>
GOOGLE_SHEETS_SPREADSHEET_ID=<your-spreadsheet-id>

# n8n Webhooks
N8N_WEBHOOK_SYNC=https://n8n.yourdomain.com/webhook/sync-contacts
N8N_WEBHOOK_BROADCAST=https://n8n.yourdomain.com/webhook/broadcast-whatsapp
N8N_WEBHOOK_TOKEN=<secure-token>

# Admin Credentials (CHANGE THESE!)
ADMIN_EMAIL=admin@hewane.com
ADMIN_PASSWORD=<secure-password>

# Application
NODE_ENV=production
LOG_LEVEL=info
TIMEZONE=Africa/Nairobi
EOF
```

### 2.3 Build & Deploy

```bash
# Build Next.js app
pnpm build

# Test production build locally
pnpm start
```

### 2.4 Docker Deployment

```bash
# Build Docker image
docker build -t hewane-dashboard .

# Run container
docker run -d \
  --name hewane-dashboard \
  -p 3000:3000 \
  --env-file .env.local \
  hewane-dashboard

# Check logs
docker logs -f hewane-dashboard
```

### 2.5 PM2 Process Management

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 config
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: "hewane-dashboard",
      script: "pnpm",
      args: "start",
      instances: 2,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Phase 3: Testing

### 3.1 Login Test

```bash
curl -X POST https://dashboard.hewane.com/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hewane.com","password":"your-password"}'
```

### 3.2 Stats API Test

```bash
curl https://dashboard.hewane.com/api/stats \
  -H "Cookie: next-auth.session-token=<session-token>"
```

### 3.3 Contact Sync Test

```bash
curl -X POST https://dashboard.hewane.com/api/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<session-token>" \
  -d '{"mode":"full"}'
```

### 3.4 Broadcast Test

```bash
curl -X POST https://dashboard.hewane.com/api/broadcast/start \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<session-token>" \
  -d '{
    "campaignName": "Test Campaign",
    "messageBody": "Hello {{name}}, this is a test!",
    "contactGroup": "all",
    "deliverySpeed": "Standard"
  }'
```

---

## Phase 4: Monitoring & Maintenance

### 4.1 Health Checks

```bash
# Check dashboard status
curl https://dashboard.hewane.com/api/stats

# Check n8n status
curl https://n8n.yourdomain.com/healthz

# Check logs
pm2 logs hewane-dashboard
docker logs hewane-dashboard
```

### 4.2 Backup Strategy

```bash
# Backup Google Sheets (automated)
- Enable version history in Google Sheets
- Set automatic backups to Google Drive

# Backup n8n workflows (monthly)
- Export workflows from n8n UI
- Store in secure location
```

### 4.3 Updates

```bash
# Update dashboard
cd /path/to/dashboard
git pull origin main
pnpm install
pnpm build
pm2 restart hewane-dashboard
```

---

## Troubleshooting

### Dashboard won't start
```bash
# Check environment variables
env | grep NEXTAUTH
env | grep GOOGLE

# Check logs
pm2 logs hewane-dashboard
docker logs hewane-dashboard

# Rebuild if needed
pnpm clean
pnpm install
pnpm build
```

### n8n webhooks not firing
```bash
# Verify webhook URL is reachable
curl -v https://dashboard.hewane.com/api/sync

# Check n8n logs
docker logs n8n

# Verify firewall rules
sudo ufw status
sudo ufw allow 443/tcp
```

### Google Sheets API errors
```bash
# Verify credentials are valid
node -e "console.log(process.env.GOOGLE_SHEETS_PRIVATE_KEY)"

# Check service account permissions
# Google Cloud Console → Service Accounts → Permissions

# Check spreadsheet sharing
# Share sheet with service account email
```

---

## Support

For deployment issues:
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions
- Check [API.md](./API.md) for API reference
- Check [SECURITY.md](./SECURITY.md) for security guidelines
- Contact: support@hewane.com

---

**Setup Complete!** Your dashboard is ready for production. Visit `https://dashboard.hewane.com` and login with your admin credentials.

# Hewane Dashboard - Quick Reference Card

## 🎯 What You Have

A **production-ready WhatsApp broadcast dashboard** with 6 pages, 10 APIs, authentication, and full admin control.

---

## ⚡ Quick Start (5 Minutes)

### 1. Clone & Install
```bash
git clone <repo>
cd hewane-dashboard
pnpm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

### 3. Run Locally
```bash
pnpm dev
# Visit http://localhost:3000/login
# Default: admin@hewane.com / password123
```

---

## 📊 Dashboard Pages at a Glance

| Page | Purpose | Key Features |
|------|---------|--------------|
| **Home** | Overview | 4 KPI cards, system health |
| **Contacts** | Manage people | Table, search, sync, validate |
| **Templates** | Message patterns | Create, edit, preview, copy |
| **Broadcast** | Send messages | Form, progress bar, pause/stop |
| **Analytics** | Track results | Metrics, charts, export |
| **Settings** | Configure | Admin panel, notifications |

---

## 🔌 API Endpoints

```
POST    /api/auth/callback/credentials    Login
GET     /api/stats                        Dashboard KPIs
GET/POST /api/contacts                    CRUD contacts
POST    /api/contacts/validate            Dry-run test
POST    /api/sync                         Sync to Sheets
GET/POST /api/templates                   Message templates
POST    /api/broadcast/start              Launch campaign
POST    /api/broadcast/pause              Pause campaign
POST    /api/broadcast/stop               Stop campaign
GET     /api/analytics                    Campaign metrics
GET     /api/analytics/export             Export (CSV/Excel/PDF)
```

---

## 🚀 Deploy to VPS (10 Steps)

### Step 1: VPS Preparation
```bash
ssh root@your-vps-ip
apt-get update && apt-get install -y docker.io docker-compose nginx
```

### Step 2: Clone Repository
```bash
git clone <repo> /opt/hewane
cd /opt/hewane
```

### Step 3: Configure Environment
```bash
cp .env.example .env.local
# Edit with your credentials
```

### Step 4: Setup Google Sheets
1. Create 4-tab Google Sheet (Contacts, Analytics, SyncLog, Templates)
2. Share with service account email
3. Get spreadsheet ID from URL

### Step 5: Setup n8n
```bash
mkdir -p /opt/n8n
cd /opt/n8n
# Use docker-compose.yml from project
docker-compose up -d
# Create Workflow A (Contact Sync)
# Create Workflow B (WhatsApp Broadcast)
```

### Step 6: Configure Cloudflare
1. Add domain to Cloudflare
2. Enable SSL/TLS
3. Create DNS records (dashboard.hewane.com)

### Step 7: Setup Nginx
```bash
# Copy nginx config from DEPLOYMENT.md
sudo systemctl restart nginx
```

### Step 8: Build & Deploy
```bash
cd /opt/hewane
docker build -t hewane-dashboard .
docker-compose up -d
```

### Step 9: Verify
```bash
curl https://dashboard.hewane.com/login
```

### Step 10: Monitor
```bash
docker logs -f hewane-dashboard
```

---

## 🔑 Key Files to Know

| File | Purpose |
|------|---------|
| `.env.example` | Environment template |
| `Dockerfile` | Container image |
| `docker-compose.yml` | Full stack setup |
| `app/api/` | 10 API endpoints |
| `app/(dashboard)/` | 6 dashboard pages |
| `lib/sheets.ts` | Google Sheets client |
| `lib/auth.ts` | Authentication config |

---

## 📚 Documentation Index

| Document | Read When |
|----------|-----------|
| **README.md** | Getting started, overview |
| **API.md** | Building integrations |
| **DEPLOYMENT.md** | Setting up production |
| **SETUP.md** | Configuring infrastructure |
| **SECURITY.md** | Security audit |
| **PROJECT_SUMMARY.md** | Full project details |

---

## 🔐 Security Essentials

1. **Generate NextAuth Secret**
   ```bash
   openssl rand -base64 32
   ```

2. **Create Service Account**
   - Google Cloud Console
   - Download JSON key
   - Share Sheets with email

3. **Set Environment Variables**
   - All in `.env.local`
   - Never commit secrets
   - Use strong passwords

4. **Enable HTTPS**
   - Cloudflare SSL
   - Nginx certificate
   - Auto-renew enabled

---

## 🆘 Troubleshooting

### App won't start
```bash
# Check logs
docker logs hewane-dashboard

# Rebuild
docker-compose down
docker build -t hewane-dashboard .
docker-compose up
```

### Google Sheets error
```bash
# Verify credentials
env | grep GOOGLE

# Check service account permissions
# Google Cloud Console → Service Accounts
```

### n8n webhooks not firing
```bash
# Verify URL reachable
curl https://dashboard.hewane.com/api/sync

# Check n8n logs
docker logs n8n
```

---

## 📱 Login Credentials

**Default Login:**
- Email: `admin@hewane.com`
- Password: *(from .env.local)*

**Change in Settings page** after first login.

---

## ⚙️ Configuration Checklist

- [ ] Google Sheets 4-tab schema created
- [ ] Service account credentials obtained
- [ ] n8n instance deployed
- [ ] n8n workflows created (A & B)
- [ ] Cloudflare domain configured
- [ ] Nginx reverse proxy setup
- [ ] NextAuth secret generated
- [ ] Admin password set
- [ ] Environment variables configured
- [ ] Docker image built
- [ ] Container running
- [ ] HTTPS verified

---

## 📊 Tech Stack One-Liner

**Next.js 16 + React 19 + TypeScript + Tailwind + Google Sheets + n8n + Docker**

---

## 🎯 Core Features

✓ Contact management (import, validate, sync)
✓ Message templates (with variables)
✓ WhatsApp broadcasts (segmented, tracked)
✓ Campaign analytics (metrics, export)
✓ Admin dashboard (responsive, mobile-friendly)
✓ API-first architecture (10 endpoints)
✓ Production-ready (Docker, PM2, Nginx)

---

## 📞 Quick Links

- **GitHub:** [Your repo URL]
- **Live Demo:** https://dashboard.hewane.com
- **Support:** support@hewane.com
- **Docs:** See README.md

---

## 🚀 Next: What to Do Now

### Immediately
1. Read README.md
2. Review SETUP.md
3. Prepare VPS access
4. Get Google credentials

### This Week
1. Follow SETUP.md
2. Deploy to VPS
3. Test all features
4. Train admin users

### This Month
1. Launch production
2. Setup monitoring
3. Create backup strategy
4. Document runbooks

---

**Status:** Production Ready ✓  
**Version:** 1.0.0  
**Last Updated:** June 18, 2026

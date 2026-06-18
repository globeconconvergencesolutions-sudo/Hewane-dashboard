# Hewane School of Music - Dashboard

A modern WhatsApp Broadcast & Contact Management Dashboard for the Hewane School of Music. Manage contacts, create message templates, schedule broadcasts, and track analytics—all in one place.

## 🚀 Features

### Core Functionality
- **Dashboard Home** - Real-time KPIs and system health status
- **Contacts Management** - View, import, validate, and sync contacts with Google Sheets
- **Message Templates** - Create reusable templates with variable support
- **Broadcast Campaigns** - Schedule WhatsApp broadcasts with multiple delivery speeds
- **Analytics** - Track campaign performance and export reports
- **Settings** - Configure organization settings, notifications, and admin preferences

### Technology Stack
- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS v4
- **Data Management**: React Hook Form + TanStack Table
- **Backend**: Next.js API Routes + Google Sheets API
- **Authentication**: NextAuth v5 (email/password)
- **Infrastructure**: Docker + Nginx + Cloudflare SSL on Contabo VPS
- **Integrations**: n8n for workflow automation, Google Sheets for data storage
- **Logging**: tslog for structured logging

## 📋 Project Structure

```
/app
  /api                          # API Routes (10 endpoints)
    /auth/[...nextauth]        # NextAuth handler
    /stats                      # Dashboard KPIs
    /contacts                   # Contact CRUD & validation
    /sync                       # Google Sheets sync
    /templates                  # Template management
    /broadcast                  # Campaign control
    /analytics                  # Metrics & export
  /(dashboard)                  # Protected routes
    /page.tsx                   # Dashboard home
    /contacts/page.tsx          # Contacts list
    /templates/page.tsx         # Message templates
    /broadcast/page.tsx         # Create campaign
    /analytics/page.tsx         # Reports & analytics
    /settings/page.tsx          # Configuration
  /login/page.tsx               # Login page
  /layout.tsx                   # Root layout

/components
  /ui                           # shadcn/ui components
  /dashboard                    # Dashboard-specific components
    /sidebar.tsx                # Navigation sidebar
    /contacts-table.tsx         # Contact table with TanStack

/lib
  /types.ts                     # TypeScript interfaces
  /auth.ts                      # NextAuth configuration
  /sheets.ts                    # Google Sheets client
  /logger.ts                    # Structured logging
  /constants.ts                 # App constants

/hooks
  /use-toast.ts                 # Toast notifications (sonner)
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+
- pnpm (package manager)
- Google Cloud project with Sheets API enabled
- n8n instance (self-hosted or cloud)

### Local Development

1. **Clone & Install**
```bash
git clone <repo-url>
cd hewane-dashboard
pnpm install
```

2. **Environment Setup**
```bash
cp .env.example .env.local

# Set required variables:
# NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
# NEXTAUTH_URL=http://localhost:3000
# GOOGLE_SHEETS_ID=<your-spreadsheet-id>
# GOOGLE_SERVICE_ACCOUNT_EMAIL=<service-account-email>
# GOOGLE_PRIVATE_KEY=<base64-encoded-private-key>
# N8N_WEBHOOK_URL=<your-n8n-webhook>
# N8N_API_KEY=<your-n8n-api-key>
```

3. **Setup Google Sheets**
   - Create a new Google Sheet with 4 tabs:
     - `Contacts` (columns: Email, Phone, Name, Segment, Added)
     - `Analytics` (columns: CampaignID, Name, Date, Sent, Delivered, Failed)
     - `SyncLog` (columns: Timestamp, Action, Status, RecordCount)
     - `Templates` (columns: ID, Name, Body, Variables, Created)

4. **Run Dev Server**
```bash
pnpm dev
```

Visit `http://localhost:3000/login` (Default: admin@hewane.com / password123)

## 🔌 API Routes Reference

| Route | Method | Description |
|-------|--------|-------------|
| `/api/stats` | GET | Dashboard KPIs |
| `/api/contacts` | GET/POST | Contact operations |
| `/api/contacts/validate` | POST | Validation-only sync |
| `/api/sync` | POST | Trigger n8n Workflow A |
| `/api/templates` | GET/POST | Template CRUD |
| `/api/broadcast/start` | POST | Start broadcast |
| `/api/broadcast/pause` | POST | Pause broadcast |
| `/api/broadcast/stop` | POST | Stop broadcast |
| `/api/analytics` | GET | Campaign metrics |
| `/api/analytics/export` | GET | Export CSV/Excel/PDF |

## 📊 Google Sheets Schema

### Contacts Tab
```
| Email | Phone | Name | Segment | Added |
|-------|-------|------|---------|-------|
| ... | +254... | ... | Students | 2026-06-18 |
```

### Analytics Tab
```
| CampaignID | Name | Date | Sent | Delivered | Failed | SuccessRate |
|-----------|------|------|------|-----------|--------|-------------|
| ... | Holiday Updates | 2026-06-18 | 1000 | 950 | 50 | 95% |
```

### SyncLog Tab
```
| Timestamp | Action | Status | RecordCount |
|-----------|--------|--------|-------------|
| 2026-06-18T10:30:00Z | SYNC | SUCCESS | 150 |
```

### Templates Tab
```
| ID | Name | Body | Variables | Created |
|----|------|------|-----------|---------|
| 1 | Welcome | "Hi {{name}}, welcome!" | ["{{name}}"] | 2026-06-18 |
```

## 🔐 Security Features

- **Session-Based Auth**: NextAuth with secure session management
- **Route Protection**: Middleware validates authentication on all dashboard routes
- **Input Validation**: Zod schemas for all API requests
- **Rate Limiting**: Implement via n8n rate limiting
- **HTTPS**: Enforced via Cloudflare SSL
- **Environment Secrets**: All credentials stored in `.env.local` (never in code)
- **CORS**: Configured for n8n webhook endpoints only
- **Audit Logging**: All actions logged via tslog

## 📱 Deployment

### Docker Deployment (Contabo VPS)

```bash
# Build image
docker build -t hewane-dashboard .

# Run container
docker run -p 3000:3000 \
  -e NEXTAUTH_SECRET=... \
  -e GOOGLE_SHEETS_ID=... \
  hewane-dashboard

# Or use docker-compose
docker-compose up -d
```

### Nginx Reverse Proxy Configuration
```nginx
server {
    listen 443 ssl;
    server_name dashboard.hewane.com;

    ssl_certificate /etc/letsencrypt/live/hewane.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hewane.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### PM2 Process Management
```bash
pm2 start "pnpm start" --name "hewane-dashboard"
pm2 save
pm2 startup
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed production setup.

## 🧪 Testing

### Running Tests
```bash
pnpm test                    # All tests
pnpm test:watch             # Watch mode
pnpm test:coverage          # Coverage report
```

### API Testing with Postman
- Import the Postman collection: `/docs/postman-collection.json`
- Configure environment variables for API endpoints
- Test all 10 routes with sample data

## 📖 n8n Workflow Integration

### Workflow A: Contact Sync
- **Trigger**: Dashboard `/api/sync` endpoint
- **Steps**:
  1. Receive contacts from Dashboard
  2. Validate contact data
  3. Upsert into Google Sheets (Contacts tab)
  4. Update SyncLog with status
  5. Return success/error response

### Workflow B: Broadcast Campaign
- **Trigger**: Dashboard `/api/broadcast/start` endpoint
- **Steps**:
  1. Fetch contacts from Google Sheets (filtered by segment)
  2. Send WhatsApp messages via Twilio
  3. Update Analytics tab with delivery status
  4. Poll for delivery confirmations
  5. Return progress via `/api/broadcast/status`

**Webhook URLs**:
```
POST https://your-domain.com/api/broadcast/start
POST https://your-domain.com/api/broadcast/pause
POST https://your-domain.com/api/broadcast/stop
```

## 🐛 Troubleshooting

**Login fails**: Check NEXTAUTH_SECRET is set and NEXTAUTH_URL matches domain

**Google Sheets API errors**: Verify service account has Editor access to spreadsheet

**n8n webhooks not firing**: Confirm N8N_WEBHOOK_URL is reachable and n8n service is running

**Contacts not syncing**: Check Google Sheets schema matches expected columns

See [SECURITY.md](./SECURITY.md) for security audit checklist.

## 📝 License

Internal use only for Hewane School of Music

## 👥 Support

For issues or feature requests: support@hewane.com

---

**Built with Next.js 16 + React 19 + TypeScript**
Last Updated: June 18, 2026

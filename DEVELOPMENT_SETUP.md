# Hewane School of Music Dashboard - Development Setup

## Quick Start

### 1. Generate Password Hash

To set up authentication credentials, generate a password hash using this command:

```bash
node -e "const bcrypt = require('bcryptjs'); const salt = bcrypt.genSaltSync(10); const hash = bcrypt.hashSync('password123', salt); console.log('Hash:', hash);"
```

Copy the generated hash (starts with `$2a$`).

### 2. Create .env.local

```bash
cp .env.example .env.local
```

Edit `.env.local` and add:

```env
# Admin Credentials (for local development)
ADMIN_EMAIL=admin@hewaneschoolofmusic.com
ADMIN_PASSWORD_HASH=<paste hash from step 1>

# NextAuth
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# Google Sheets (Optional for now)
GOOGLE_SHEETS_ID=your-sheet-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY=your-service-account-key

# n8n Webhooks (Optional for now)
N8N_WORKFLOW_A_URL=https://n8n.example.com/webhook/workflow-a
N8N_WORKFLOW_B_URL=https://n8n.example.com/webhook/workflow-b
N8N_BASE_URL=https://n8n.example.com
N8N_API_KEY=your-n8n-api-key
```

### 3. Run Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000`

- **Email:** `admin@hewaneschoolofmusic.com`
- **Password:** `password123`

## Testing the Dashboard

### Login Flow
1. Visit `http://localhost:3000` → redirects to login
2. Enter credentials
3. Submit → redirects to dashboard home

### Dashboard Pages
- `/` - Dashboard home (KPIs)
- `/contacts` - Contact management
- `/templates` - Message templates
- `/broadcast` - Broadcast campaigns
- `/analytics` - Analytics and exports
- `/settings` - Configuration

### API Endpoints (Authenticated)
```bash
# View dashboard stats
curl -b "sessionId=..." http://localhost:3000/api/stats

# View contacts
curl -b "sessionId=..." http://localhost:3000/api/contacts

# View templates
curl -b "sessionId=..." http://localhost:3000/api/templates

# View analytics
curl -b "sessionId=..." http://localhost:3000/api/analytics
```

## Debugging

### Check Auth Session
Add this to any client component:
```tsx
import { useSession } from "next-auth/react";

export default function Debug() {
  const { data: session } = useSession();
  return <pre>{JSON.stringify(session, null, 2)}</pre>;
}
```

### View Console Logs
Look for `[v0]` prefixed messages in browser console for debug output.

## Branding

The dashboard uses Hewane School colors:
- **Primary Purple:** `#7D3F7E`
- **Gold Accent:** `#E8B825`
- **Navy Background:** `#1a1a2e`
- **Cream Neutral:** `#f8f7f4`

All colors are in `/app/globals.css` under CSS variables.

## Common Issues

### "Invalid email or password"
- Check `.env.local` has `ADMIN_PASSWORD_HASH` set correctly
- Verify password hash starts with `$2a$`

### Page not loading after login
- Check browser console for errors
- Verify session is being created (check cookies)
- Check NextAuth config in `/lib/auth.ts`

### Build errors
- Run `pnpm clean` and rebuild
- Check all TypeScript types with `pnpm type-check`

## Next Steps

1. **Setup Google Sheets** (if ready)
   - Create sheet with 4 tabs: Contacts, Analytics, SyncLog, Templates
   - Get Sheet ID and service account credentials
   - Update `.env.local`

2. **Setup n8n** (if ready)
   - Deploy n8n instance
   - Create two workflows (Sync & Broadcast)
   - Get webhook URLs and API key
   - Update `.env.local`

3. **Test CRUD Operations**
   - Create/read/update/delete contacts
   - Create/edit/delete message templates
   - Start a test broadcast campaign
   - View analytics and exports

4. **Production Deployment**
   - Update environment for production domain
   - Setup SSL/TLS
   - Configure logging
   - Deploy Docker container

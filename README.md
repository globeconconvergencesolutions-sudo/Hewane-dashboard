# Hewane School of Music — Staff Dashboard

Staff-only web app for managing **Google Sheets contacts**, **WhatsApp broadcast campaigns**, **message templates**, and **campaign analytics**. The dashboard talks to **n8n** for automation and to **Google Sheets** for data.

Built for demo and ongoing development — suitable to share with colleagues for review before production hardening.

---

## Quick start (local)

### Prerequisites

- **Node.js 20+** and **pnpm**
- **PostgreSQL** (Neon, Docker, or local)
- **Google Cloud service account** with Sheets API access
- **n8n** with the two Hewane workflows imported (see below)

### 1. Install and configure

```bash
cd Hewane-dashboard
pnpm install
cp .env.example .env.local
```

Edit `.env.local`:

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Session signing (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Yes | App URL in browser (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_SITE_URL` | Yes | Same as above for SEO / Open Graph |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Yes | Service account client email |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Yes | Private key (`\n` for newlines) |
| `N8N_VALIDATE_WEBHOOK_URL` | For validate | Webhook `…/hewane-validate` |
| `N8N_WORKFLOW_A_URL` | For sync | Webhook `…/hewane-sheets-sync` |
| `N8N_WORKFLOW_B_URL` | For broadcast | Webhook `…/hewane-broadcast-trigger` |
| `N8N_BASE_URL` | Optional | n8n host (pause/stop controls) |
| `N8N_API_KEY` | Optional | n8n API key for pause/stop |

Share **every spreadsheet** in `sheets.config.json` with the service account as **Editor**.

### 2. Database seed (first run)

```bash
pnpm db:setup
```

Creates the admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env.local`.

### 3. Run

```bash
pnpm dev
```

Open [http://localhost:3000/sign-in](http://localhost:3000/sign-in)

In-app **Help & Guide** (`/help`) explains daily workflows for staff.

---

## Google Sheets configuration

Edit **`sheets.config.json`** at the project root (not `.env`).

Supports **multiple contact sources**, each with its own spreadsheet, tab, and column mapping:

- `schema: "hewane"` — recommended Hewane column layout  
- `schema: "google-contacts"` — Google Contacts export headers  
- `schema: "custom"` — manual `headers` / `columns` mapping  

Optional tabs on the primary spreadsheet: **Templates**, **Analytics**, **SyncLog** (for writes and reporting).

---

## n8n workflows

Workflow JSON files live next to this repo:

```
../workflows/
  Hewane – Workflow A_ Whatsapp Broadcast message.json
  Hewane – Workflow B_ Multi-Sheet Sync.json
```

### Naming note (important)

n8n export **file names** (A/B) do **not** match dashboard **env var** names. Use webhook paths:

| Dashboard env var | Webhook path | Dashboard action |
|-------------------|--------------|------------------|
| `N8N_VALIDATE_WEBHOOK_URL` | `hewane-validate` | Contacts → **Validate** |
| `N8N_WORKFLOW_A_URL` | `hewane-sheets-sync` | Contacts → **Sync Sheets** |
| `N8N_WORKFLOW_B_URL` | `hewane-broadcast-trigger` | Broadcast → **Start campaign** |

Example URLs:

```env
N8N_VALIDATE_WEBHOOK_URL=https://<n8n-host>/webhook/hewane-validate
N8N_WORKFLOW_A_URL=https://<n8n-host>/webhook/hewane-sheets-sync
N8N_WORKFLOW_B_URL=https://<n8n-host>/webhook/hewane-broadcast-trigger
```

Legacy n8n export file names (A = broadcast, B = sync) differ from the `N8N_WORKFLOW_A/B` env var letters — use webhook paths above.

### After importing workflows in n8n

1. Assign **Google Sheets** credentials on sheet nodes  
2. Assign **Meta / WhatsApp HTTP** credentials on send nodes  
3. Set `WHATSAPP_PHONE_NUMBER_ID` in n8n environment  
4. **Activate** all three workflows (validate, sync, broadcast)  
5. Share all spreadsheets with the Google service account  

Development often uses a **Cloudflare tunnel** URL — update all three n8n env vars when the tunnel changes.

---

## App features

| Area | Route | Notes |
|------|-------|-------|
| Overview | `/` | KPIs, sync health, quick actions |
| Contacts | `/contacts` | Search, filters, pagination, sync, validate |
| Templates | `/templates` | Create, copy, duplicate; use in broadcast |
| Broadcast | `/broadcast` | Template or custom message; delivery speeds |
| Analytics | `/analytics` | Campaign history; CSV / Excel / PDF export |
| Settings | `/settings` | Preferences; connected sheets overview |
| Help | `/help` | Staff guide and FAQ |

---

## Project layout

```
app/
  (dashboard)/          # Protected pages (auth required)
  api/                    # REST endpoints (stats, contacts, sync, broadcast, …)
  sign-in/  sign-up/
components/
  dashboard/              # Sidebar, contacts workspace, help guide, …
  ui/                     # Shared UI primitives
lib/
  sheets-config.ts        # Reads sheets.config.json
  auth.ts                 # Better Auth server config
public/
  icon.svg                # Hewane logo (source for favicons)
  manifest.webmanifest
scripts/
  db-setup.ts             # Admin seed
  generate-icons.mjs      # Regenerate favicons from icon.svg
sheets.config.json        # Multi-sheet Google config
```

---

## Scripts

```bash
pnpm dev              # Development server (port 3000)
pnpm build            # Generate icons + production build
pnpm start            # Run production build
pnpm icons:generate   # Regenerate favicons / og-image from icon.svg
pnpm db:setup         # Create tables + seed admin user
pnpm lint             # ESLint
```

---

## Docker (optional)

Local Postgres + dashboard:

```bash
# Set BETTER_AUTH_SECRET and Google/n8n vars in .env.local first
docker compose up -d
```

The dashboard container mounts `sheets.config.json` read-only so sheet config can change without rebuilding.

Production build uses Next.js **standalone** output. Ensure `sheets.config.json` is present at runtime (included in the image and volume-mounted in compose).

---

## Deployment checklist (colleague handoff)

- [ ] `.env` / hosting secrets: `DATABASE_URL`, `BETTER_AUTH_*`, `NEXT_PUBLIC_SITE_URL`  
- [ ] Google service account + `sheets.config.json` verified  
- [ ] n8n workflows imported, credentials set, workflows **active**  
- [ ] `N8N_VALIDATE_WEBHOOK_URL`, `N8N_WORKFLOW_A_URL`, and `N8N_WORKFLOW_B_URL` point to live webhooks  
- [ ] `pnpm build && pnpm start` (or Docker) succeeds  
- [ ] Sign in, load Contacts, run Validate, test Broadcast in dry/n8n test mode  
- [ ] Set `DISABLE_SIGNUP=true` in production  

---

## API overview

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/stats` | GET | Dashboard KPIs |
| `/api/contacts` | GET | Paginated contacts |
| `/api/contacts/validate` | POST | Validate sheets (→ hewane-validate) |
| `/api/sync` | POST | Sync sheets (→ n8n A) |
| `/api/templates` | GET, POST | Message templates |
| `/api/broadcast/start` | POST | Start campaign (→ n8n B) |
| `/api/broadcast/pause` | POST | Pause (needs `N8N_API_KEY`) |
| `/api/broadcast/stop` | POST | Stop (needs `N8N_API_KEY`) |
| `/api/analytics` | GET | Campaign metrics |
| `/api/sheets/config` | GET | Connected sheet sources |

All `/api/*` routes except `/api/auth/*` require a signed-in session.

---

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Better Auth** + **PostgreSQL** (Neon in current setup)
- **Google Sheets API** via service account
- **n8n** for sync and WhatsApp delivery
- **Tailwind CSS v4** + shadcn-style UI components
- **Sonner** toasts, structured logging via **tslog**

---

## Known limitations (in progress)

- Broadcast progress is driven by n8n responses; live polling is limited without `N8N_API_KEY`  
- Templates / Analytics tabs may need to be created on the primary spreadsheet  
- Some sheet schemas (Google Contacts export) are read-optimized; write-back may need Hewane-standard columns  
- n8n tunnel URLs change each session during local dev  

---

## Support

- In-app: **Help & Guide** at `/help`  
- Email: support@hewane.com  

Internal use — Hewane School of Music / Globcons Ltd.

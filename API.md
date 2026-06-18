# Hewane Music Dashboard - API Documentation

## Overview
Complete REST API documentation for the WhatsApp Broadcast & Contact Management Dashboard.

---

## Authentication

All API endpoints require a valid session. Authentication is handled via NextAuth v5.

**Headers Required:**
```
Cookie: next-auth.session-token=<session_token>
Content-Type: application/json
```

**Login Flow:**
1. POST to `/api/auth/callback/credentials` with email and password
2. Receive session token
3. Include token in all subsequent requests

---

## API Endpoints

### 1. Dashboard Stats
**GET** `/api/stats`

Returns KPI data for the dashboard home page.

**Response:**
```json
{
  "totalContacts": 1250,
  "totalMessagesSent": 8734,
  "successRate": 94.2,
  "syncHealth": "Healthy",
  "lastSyncTime": "2026-06-18T10:30:00Z",
  "upcomingBroadcasts": 3,
  "failedMessages": 523,
  "pendingDelivery": 45
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 500: Server error

---

### 2. Contacts - List & Create
**GET** `/api/contacts`

Fetch all contacts from Google Sheets.

**Query Parameters:**
- `limit`: Max records (default: 100)
- `offset`: Skip N records (default: 0)
- `search`: Search by email or phone

**Response:**
```json
[
  {
    "id": "contact_001",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+254712345678",
    "segment": "Premium",
    "dateAdded": "2026-06-01T00:00:00Z",
    "lastMessaged": "2026-06-15T14:30:00Z",
    "status": "active"
  }
]
```

**POST** `/api/contacts`

Create a new contact.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+254798765432",
  "segment": "Standard"
}
```

**Response:** Contact object + 201 Created

---

### 3. Contacts - Validate
**POST** `/api/contacts/validate`

Validation-only sync (dry-run). Checks for errors without writing.

**Request Body:**
```json
{
  "contactIds": ["contact_001", "contact_002"]
}
```

**Response:**
```json
{
  "valid": false,
  "errors": [
    {
      "contactId": "contact_001",
      "field": "phone",
      "message": "Invalid phone format"
    }
  ],
  "warnings": ["2 contacts missing email addresses"]
}
```

---

### 4. Sync - Trigger Workflow
**POST** `/api/sync`

Triggers n8n Workflow A (real sync to Google Sheets).

**Request Body:**
```json
{
  "mode": "full",
  "includeDeleted": false
}
```

**Response:**
```json
{
  "syncId": "sync_12345",
  "status": "in_progress",
  "startTime": "2026-06-18T10:45:00Z",
  "estimatedDuration": "5 minutes"
}
```

---

### 5. Message Templates
**GET** `/api/templates`

List all message templates.

**Response:**
```json
[
  {
    "id": "template_001",
    "name": "Weekly Newsletter",
    "body": "Hello {{name}}, here's this week's update...",
    "variables": ["{{name}}", "{{segment}}"],
    "createdAt": "2026-06-01T00:00:00Z",
    "usageCount": 45
  }
]
```

**POST** `/api/templates`

Create a new template.

**Request Body:**
```json
{
  "name": "Course Update",
  "body": "Hi {{name}}, your {{1}} course has been updated!",
  "variables": ["{{name}}", "{{1}}"]
}
```

---

### 6. Broadcast - Start
**POST** `/api/broadcast/start`

Triggers n8n Workflow B (WhatsApp broadcast).

**Request Body:**
```json
{
  "campaignName": "Holiday Announcement",
  "messageType": "template",
  "messageBody": "Message content or template ID",
  "contactGroup": "all",
  "deliverySpeed": "Standard",
  "emailFallback": true
}
```

**Response:**
```json
{
  "campaignId": "campaign_001",
  "status": "started",
  "totalRecipients": 1250,
  "startTime": "2026-06-18T11:00:00Z"
}
```

---

### 7. Broadcast - Pause
**POST** `/api/broadcast/pause`

Pause an active broadcast campaign.

**Request Body:**
```json
{
  "campaignId": "campaign_001"
}
```

**Response:**
```json
{
  "campaignId": "campaign_001",
  "status": "paused",
  "messagesSent": 450,
  "pausedAt": "2026-06-18T11:15:00Z"
}
```

---

### 8. Broadcast - Stop
**POST** `/api/broadcast/stop`

Stop an active broadcast campaign.

**Request Body:**
```json
{
  "campaignId": "campaign_001"
}
```

**Response:**
```json
{
  "campaignId": "campaign_001",
  "status": "stopped",
  "totalSent": 450,
  "delivered": 425,
  "failed": 25,
  "stoppedAt": "2026-06-18T11:20:00Z"
}
```

---

### 9. Analytics - Get Metrics
**GET** `/api/analytics`

Fetch campaign history and metrics.

**Query Parameters:**
- `startDate`: ISO date (default: 30 days ago)
- `endDate`: ISO date (default: today)
- `limit`: Max campaigns (default: 50)

**Response:**
```json
[
  {
    "id": "campaign_001",
    "campaignName": "Holiday Update",
    "date": "2026-06-15T00:00:00Z",
    "contactGroup": "Premium",
    "totalSent": 500,
    "delivered": 475,
    "failed": 25,
    "successRate": "95%"
  }
]
```

---

### 10. Analytics - Export
**GET** `/api/analytics/export`

Export campaign data in multiple formats.

**Query Parameters:**
- `format`: `csv`, `excel`, or `pdf` (default: csv)
- `startDate`: ISO date
- `endDate`: ISO date

**Response:**
- CSV: `text/csv` content with headers
- Excel: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- PDF: `application/pdf` with formatted report

---

## Error Handling

All errors follow this format:

```json
{
  "error": "Error Code",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional context"
  }
}
```

**Common Status Codes:**
- 400: Bad Request (validation error)
- 401: Unauthorized (invalid session)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Internal Server Error

---

## Rate Limiting

API endpoints are rate-limited:
- **Public endpoints**: 100 requests/hour per IP
- **Authenticated endpoints**: 1000 requests/hour per user
- **Broadcast endpoints**: 10 requests/hour per campaign

---

## Testing with cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hewane.com","password":"password"}'

# Get stats
curl http://localhost:3000/api/stats \
  -H "Cookie: next-auth.session-token=<token>"

# Create contact
curl -X POST http://localhost:3000/api/contacts \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<token>" \
  -d '{"name":"John","email":"john@example.com","phone":"+254712345678","segment":"Premium"}'
```

---

## n8n Webhook Integration

n8n webhooks are triggered by API endpoints:

**Workflow A (Sync):**
- Endpoint: `POST /api/sync`
- n8n URL: `https://n8n.yourdomain.com/webhook/sync-contacts`
- Headers: Authorization: Bearer <n8n_webhook_token>

**Workflow B (Broadcast):**
- Endpoint: `POST /api/broadcast/start`
- n8n URL: `https://n8n.yourdomain.com/webhook/broadcast-whatsapp`
- Headers: Authorization: Bearer <n8n_webhook_token>

---

## Support & Troubleshooting

For API issues:
1. Check request format and headers
2. Verify session token is valid
3. Check Google Sheets API credentials
4. Review logs: `docker logs hewane-dashboard`
5. Contact: support@hewane.com

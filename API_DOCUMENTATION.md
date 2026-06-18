# API Documentation

Complete reference for all 10 dashboard API endpoints.

## Authentication

All endpoints require an active session (NextAuth). Include session cookies with requests.

```bash
curl -X GET http://localhost:3000/api/stats \
  -H "Cookie: next-auth.session-token=..."
```

## Endpoints

### 1. GET /api/stats

**Description**: Get dashboard KPIs and system health

**Response**:
```json
{
  "totalContacts": 1250,
  "messagesToday": 340,
  "successRate": 94.5,
  "syncHealth": "healthy",
  "lastSync": "2026-06-18T10:30:00Z",
  "activeSegments": 5,
  "templateCount": 12
}
```

---

### 2. GET /api/contacts

**Description**: Fetch all contacts from Google Sheets

**Query Parameters**:
- `segment` (optional): Filter by segment (Students, Parents, Staff, etc.)
- `limit` (optional): Max results (default: 1000)
- `offset` (optional): Pagination offset

**Response**:
```json
[
  {
    "id": "contact-1",
    "email": "student@example.com",
    "phone": "+254712345678",
    "name": "John Doe",
    "segment": "Students",
    "added": "2026-06-18T10:00:00Z"
  }
]
```

---

### 3. POST /api/contacts/validate

**Description**: Validate contacts without syncing to Google Sheets

**Request Body**:
```json
{
  "contacts": [
    {
      "email": "student@example.com",
      "phone": "+254712345678",
      "name": "John Doe"
    }
  ]
}
```

**Response**:
```json
{
  "valid": false,
  "errors": [
    {
      "index": 0,
      "email": "Invalid email format",
      "phone": "Missing country code"
    }
  ]
}
```

---

### 4. POST /api/sync

**Description**: Trigger n8n Workflow A to sync contacts to Google Sheets

**Request Body**:
```json
{
  "contacts": [
    {
      "email": "student@example.com",
      "phone": "+254712345678",
      "name": "John Doe",
      "segment": "Students"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "syncId": "sync-abc123",
  "recordsSynced": 150,
  "timestamp": "2026-06-18T10:30:00Z"
}
```

---

### 5. GET /api/templates

**Description**: Fetch all message templates

**Response**:
```json
[
  {
    "id": "tpl-1",
    "name": "Welcome Message",
    "body": "Hi {{name}}, welcome to Hewane School of Music!",
    "variables": ["{{name}}"],
    "created": "2026-06-18T09:00:00Z"
  }
]
```

### 5. POST /api/templates

**Description**: Create a new message template

**Request Body**:
```json
{
  "name": "Holiday Announcement",
  "body": "Dear {{name}}, our school will be closed on {{date}}.",
  "variables": ["{{name}}", "{{date}}"]
}
```

**Response**:
```json
{
  "id": "tpl-12",
  "name": "Holiday Announcement",
  "body": "Dear {{name}}, our school will be closed on {{date}}.",
  "variables": ["{{name}}", "{{date}}"],
  "created": "2026-06-18T10:30:00Z"
}
```

---

### 6. POST /api/broadcast/start

**Description**: Start a WhatsApp broadcast campaign via n8n Workflow B

**Request Body**:
```json
{
  "campaignName": "Summer Enrollment 2026",
  "messageType": "template",
  "messageBody": "Hi {{name}}, enrollment is now open!",
  "contactGroup": "Parents",
  "deliverySpeed": "Standard",
  "emailFallback": true
}
```

**Response**:
```json
{
  "campaignId": "campaign-abc123",
  "status": "started",
  "estimatedDuration": "15 minutes",
  "totalRecipients": 850
}
```

---

### 7. POST /api/broadcast/pause

**Description**: Pause an active broadcast campaign

**Request Body**:
```json
{
  "campaignId": "campaign-abc123"
}
```

**Response**:
```json
{
  "campaignId": "campaign-abc123",
  "status": "paused",
  "messagesSent": 450,
  "pausedAt": "2026-06-18T10:45:00Z"
}
```

---

### 8. POST /api/broadcast/stop

**Description**: Stop an active or paused broadcast campaign

**Request Body**:
```json
{
  "campaignId": "campaign-abc123"
}
```

**Response**:
```json
{
  "campaignId": "campaign-abc123",
  "status": "stopped",
  "totalSent": 450,
  "totalFailed": 25,
  "stoppedAt": "2026-06-18T10:50:00Z"
}
```

---

### 9. GET /api/analytics

**Description**: Fetch campaign history and metrics

**Query Parameters**:
- `days` (optional): Number of days to look back (default: 30)
- `limit` (optional): Max campaigns to return (default: 100)

**Response**:
```json
[
  {
    "id": "campaign-123",
    "campaignName": "Summer Enrollment",
    "date": "2026-06-18T10:00:00Z",
    "contactGroup": "Parents",
    "totalSent": 850,
    "delivered": 800,
    "failed": 50,
    "successRate": "94.1%"
  }
]
```

---

### 10. GET /api/analytics/export

**Description**: Export campaign analytics as CSV, Excel, or PDF

**Query Parameters**:
- `format` (required): "csv", "excel", or "pdf"
- `days` (optional): Days to include (default: 30)

**Response**: Binary file download
- Content-Type: `application/csv`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, or `application/pdf`

**Example**:
```bash
curl -X GET "http://localhost:3000/api/analytics/export?format=csv" \
  -H "Cookie: next-auth.session-token=..." \
  -o campaigns.csv
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Invalid request",
  "message": "Contact email is invalid",
  "status": 400,
  "timestamp": "2026-06-18T10:30:00Z"
}
```

### Common Status Codes
- `200` - Success
- `400` - Bad request (validation error)
- `401` - Unauthorized (no valid session)
- `403` - Forbidden (insufficient permissions)
- `500` - Server error

---

## Rate Limiting

Endpoints are rate limited via n8n (Workflow B) to prevent overwhelming WhatsApp API:
- **Slow**: 1 message/second (1000/hour)
- **Standard**: 5 messages/second (18,000/hour)
- **Fast**: 10 messages/second (36,000/hour)

---

## Postman Collection

Import the collection to test all endpoints:

```json
{
  "info": {
    "name": "Hewane Dashboard API",
    "version": "1.0.0"
  },
  "item": [
    {
      "name": "Stats",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/stats"
      }
    }
  ]
}
```

Save as `postman-collection.json` and import in Postman.

export const SEGMENTS = [
  "Students",
  "Parents",
  "Teachers",
  "Staff",
  "Alumni",
];

export const DELIVERY_SPEEDS = [
  { label: "Careful", delay: 5, batch: 25, description: "5s delay, 25/batch" },
  { label: "Standard", delay: 3, batch: 50, description: "3s delay, 50/batch" },
  { label: "Fast", delay: 1, batch: 100, description: "1s delay, 100/batch" },
];

export const TIMEZONE = "Africa/Nairobi";

export const SHEET_TABS = {
  CONTACTS: "Contacts",
  ANALYTICS: "Analytics",
  SYNC_LOG: "SyncLog",
  TEMPLATES: "Templates",
};

export const GOOGLE_SHEETS_COLUMNS = {
  [SHEET_TABS.CONTACTS]: [
    "id",
    "name",
    "phone",
    "email",
    "segment",
    "status",
    "lastSent",
    "waMessageId",
    "error",
    "sendWhatsapp",
    "sendEmail",
  ],
  [SHEET_TABS.ANALYTICS]: [
    "id",
    "date",
    "time",
    "campaignName",
    "messageType",
    "totalSent",
    "delivered",
    "failed",
    "emailFallback",
    "successRate",
    "contactGroup",
  ],
  [SHEET_TABS.TEMPLATES]: [
    "id",
    "name",
    "body",
    "variables",
    "createdAt",
    "lastUsed",
  ],
  [SHEET_TABS.SYNC_LOG]: [
    "timestamp",
    "action",
    "contactsAffected",
    "status",
    "error",
  ],
};

export const TEMPLATE_VARIABLES = [
  { label: "{{name}}", description: "Contact name" },
  { label: "{{segment}}", description: "Contact segment" },
  { label: "{{1}}", description: "Custom variable 1" },
  { label: "{{2}}", description: "Custom variable 2" },
];

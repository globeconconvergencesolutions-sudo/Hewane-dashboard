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
  { label: "{{1}}", description: "Variable 1 — usually contact name", defaultSource: "name" as const },
  { label: "{{2}}", description: "Variable 2 — usually segment", defaultSource: "segment" as const },
  { label: "{{3}}", description: "Variable 3 — custom text", defaultSource: "custom" as const },
  { label: "{{4}}", description: "Variable 4 — custom text", defaultSource: "custom" as const },
];

export const DEFAULT_WHATSAPP_TEMPLATE_LANGUAGE = "en_US";

export const WHATSAPP_TEMPLATE_STATUSES = [
  { id: "draft", label: "Drafts", description: "Not yet submitted to Meta" },
  { id: "pending", label: "Pending", description: "Awaiting Meta review" },
  { id: "approved", label: "Approved", description: "Verified — ready for broadcast" },
  { id: "rejected", label: "Rejected", description: "Meta declined — duplicate and fix" },
  { id: "paused", label: "Paused", description: "Disabled by Meta" },
] as const;

export interface Contact {
  id: string;
  name: string;
  phone: string; // E.164 format (254XXXXXXXXX)
  email?: string;
  segment: string; // Students | Parents | Teachers | [custom]
  status: "Sent" | "Failed" | "";
  lastSent?: Date;
  waMessageId?: string;
  error?: string;
  sendWhatsapp: "Yes" | "No";
  sendEmail: "Yes" | "No";
  /** Which spreadsheet this contact was loaded from */
  sourceSpreadsheetId?: string;
  sourceLabel?: string;
  sourceTab?: string;
}

export interface Campaign {
  id: string; // campaign_TIMESTAMP
  date: Date;
  time: string;
  campaignName: string;
  messageType: "template" | "custom";
  totalSent: number;
  delivered: number;
  failed: number;
  emailFallback: number;
  successRate: string; // "97.3%"
  contactGroup: string; // "all" | segment name
}

export interface MessageTemplate {
  id: string;
  name: string;
  body: string; // Supports {{name}}, {{segment}}, {{1}}, {{2}}
  variables: string[]; // ["{{1}}", "{{2}}"]
  createdAt: Date;
  lastUsed?: Date;
}

export interface SyncLog {
  timestamp: Date;
  action: "new" | "updated" | "removed" | "synced";
  contactsAffected: number;
  status: "success" | "failed";
  error?: string;
}

export interface DashboardStats {
  totalContacts: number;
  messagesThisMonth: number;
  deliveredThisMonth: number;
  failedThisMonth: number;
  successRate: string;
  lastSync: Date | null;
  syncHealth: "healthy" | "warning" | "error";
  workflowStatus: "running" | "stopped";
}

export interface BroadcastSession {
  campaignId: string;
  campaignName: string;
  messageType: "template" | "custom";
  contactGroup: string;
  totalContacts: number;
  totalSent: number;
  delivered: number;
  failed: number;
  startTime: Date;
  status: "pending" | "in_progress" | "completed" | "paused" | "stopped";
  n8nExecutionId?: string;
}

export interface ValidationError {
  row: number;
  field: string;
  value: string;
  error: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface ContactsPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ContactsFacets {
  segments: { value: string; count: number }[];
  sources: { value: string; label: string; count: number }[];
  statuses: { value: string; count: number }[];
  whatsapp: { yes: number; no: number };
}

export interface PaginatedContactsResponse {
  items: Contact[];
  pagination: ContactsPagination;
  facets: ContactsFacets;
  meta: {
    cachedAt: string;
    fromCache: boolean;
    queryMs?: number;
  };
}

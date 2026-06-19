export type HelpCategory =
  | "getting-started"
  | "contacts"
  | "broadcast"
  | "templates"
  | "analytics"
  | "settings"
  | "troubleshooting";

export type HelpLink = {
  href: string;
  label: string;
};

export type HelpArticle = {
  id: string;
  category: HelpCategory;
  question: string;
  answer: string[];
  bullets?: string[];
  keywords: string[];
  relatedLinks?: HelpLink[];
};

export type QuickStartStep = {
  step: number;
  title: string;
  description: string;
  href?: string;
  hrefLabel?: string;
};

export type WorkflowStage = {
  title: string;
  description: string;
  icon: "dashboard" | "n8n" | "sheets" | "whatsapp";
};

export const HELP_CATEGORIES: { id: HelpCategory; label: string; description: string }[] = [
  {
    id: "getting-started",
    label: "Getting started",
    description: "First-time setup and daily workflow",
  },
  {
    id: "contacts",
    label: "Contacts",
    description: "Sheets, sync, search, and validation",
  },
  {
    id: "broadcast",
    label: "Broadcast",
    description: "WhatsApp campaigns and delivery",
  },
  {
    id: "templates",
    label: "Templates",
    description: "Reusable messages and variables",
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Reports and exports",
  },
  {
    id: "settings",
    label: "Settings",
    description: "Preferences and configuration",
  },
  {
    id: "troubleshooting",
    label: "Troubleshooting",
    description: "Common issues and fixes",
  },
];

export const QUICK_START_STEPS: QuickStartStep[] = [
  {
    step: 1,
    title: "Sign in securely",
    description:
      "Use your Hewane staff email and password. If you cannot sign in, confirm DATABASE_URL and BETTER_AUTH_SECRET are set on the server.",
    href: "/sign-in",
    hrefLabel: "Go to sign in",
  },
  {
    step: 2,
    title: "Confirm Google Sheets access",
    description:
      "Every spreadsheet in sheets.config.json must be shared with your Google service account as Editor. Open Settings to see connected sources.",
    href: "/settings",
    hrefLabel: "View connected sheets",
  },
  {
    step: 3,
    title: "Load and validate contacts",
    description:
      "Open Contacts, click Refresh to load from cache, then Validate to check phone numbers and sheet structure before sending anything.",
    href: "/contacts",
    hrefLabel: "Open contacts",
  },
  {
    step: 4,
    title: "Create or pick a template",
    description:
      "Build a reusable message with placeholders like {{name}}. Templates save to your primary spreadsheet Templates tab when configured.",
    href: "/templates",
    hrefLabel: "Manage templates",
  },
  {
    step: 5,
    title: "Launch a broadcast",
    description:
      "Choose a contact group, delivery speed, and message. The dashboard triggers n8n Workflow B, which sends WhatsApp messages via Meta.",
    href: "/broadcast",
    hrefLabel: "Start broadcast",
  },
  {
    step: 6,
    title: "Review results",
    description:
      "Track delivery in Analytics and on the dashboard home. Export CSV or Excel for records when needed.",
    href: "/analytics",
    hrefLabel: "View analytics",
  },
];

export const SYSTEM_WORKFLOW: WorkflowStage[] = [
  {
    title: "Hewane Dashboard",
    description:
      "You manage contacts, templates, and campaigns here. Actions call secure API routes that never expose secrets to the browser.",
    icon: "dashboard",
  },
  {
    title: "n8n Workflows",
    description:
      "Workflow A syncs Google Sheets contacts. Workflow B runs broadcast campaigns with rate limiting and optional email fallback.",
    icon: "n8n",
  },
  {
    title: "Google Sheets",
    description:
      "Contact lists live in one or more spreadsheets. sheets.config.json maps each source, including custom Google Contacts export columns.",
    icon: "sheets",
  },
  {
    title: "WhatsApp / Meta",
    description:
      "Messages are sent through your WhatsApp Business API number configured in n8n. Delivery status can be logged to Analytics.",
    icon: "whatsapp",
  },
];

export const ADMIN_CHECKLIST: string[] = [
  "PostgreSQL database running (DATABASE_URL)",
  "BETTER_AUTH_SECRET and BETTER_AUTH_URL set correctly",
  "Google service account shared on every spreadsheet",
  "sheets.config.json lists all contact sources with correct tab names",
  "N8N_WORKFLOW_A_URL → hewane-sheets-sync (n8n file: Workflow B — Multi-Sheet Sync)",
  "N8N_WORKFLOW_B_URL → hewane-broadcast-trigger (n8n file: Workflow A — WhatsApp Broadcast)",
  "N8N_API_KEY set if you need pause/stop controls during broadcasts",
  "Templates, Analytics, and SyncLog tabs on primary spreadsheet (optional but recommended)",
];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "what-is-dashboard",
    category: "getting-started",
    question: "What is the Hewane Dashboard?",
    answer: [
      "The Hewane Dashboard is a staff-only control center for the School of Music. It connects your Google Sheets contact lists to WhatsApp broadcast campaigns through n8n automation.",
      "You can search thousands of contacts without slow page loads, create message templates, launch campaigns to specific groups, and review delivery metrics — all in one place.",
    ],
    keywords: ["overview", "introduction", "purpose", "what"],
    relatedLinks: [{ href: "/", label: "Dashboard home" }],
  },
  {
    id: "daily-workflow",
    category: "getting-started",
    question: "What is the recommended daily workflow?",
    answer: [
      "Most staff sessions follow a simple rhythm: refresh contacts, validate if you edited sheets, sync when needed, then broadcast.",
    ],
    bullets: [
      "Check Dashboard home for sync health and contact totals",
      "Refresh Contacts after updating Google Sheets",
      "Validate before a large send to catch bad phone numbers",
      "Use Templates for consistent messaging",
      "Start Broadcast, then review Analytics when complete",
    ],
    keywords: ["workflow", "daily", "routine", "process"],
    relatedLinks: [{ href: "/contacts", label: "Contacts" }],
  },
  {
    id: "who-can-access",
    category: "getting-started",
    question: "Who can access the dashboard?",
    answer: [
      "Only authorized Hewane staff with a registered account can sign in. Authentication is handled by Better Auth with sessions stored securely.",
      "Sign-up may be disabled in production — ask your administrator to create your account or run the database seed script.",
    ],
    keywords: ["login", "access", "account", "sign up", "auth"],
    relatedLinks: [{ href: "/sign-in", label: "Sign in" }],
  },
  {
    id: "contacts-load",
    category: "contacts",
    question: "Why do contacts load in pages instead of all at once?",
    answer: [
      "Contact lists can be very large. The dashboard caches sheet data server-side and serves paginated results with search and filters so the page stays fast.",
      "Use the search box and segment/source filters to narrow results. Change page size (10–100) in the footer controls.",
    ],
    keywords: ["pagination", "slow", "search", "filter", "cache"],
    relatedLinks: [{ href: "/contacts", label: "Contacts workspace" }],
  },
  {
    id: "contacts-sync",
    category: "contacts",
    question: "What does Sync Sheets do?",
    answer: [
      "Sync Sheets triggers n8n Workflow A (hewane-sheets-sync). It pulls the latest rows from all configured spreadsheets and refreshes the dashboard cache.",
      "Use Sync after bulk edits in Google Sheets or when contacts look out of date. A successful sync updates the last sync time on the dashboard home.",
    ],
    keywords: ["sync", "google sheets", "workflow a", "refresh", "pull"],
    relatedLinks: [{ href: "/contacts", label: "Sync from Contacts" }],
  },
  {
    id: "contacts-validate",
    category: "contacts",
    question: "What does Validate do?",
    answer: [
      "Validate runs a read-only check across your configured sheets. It flags missing phones, invalid formats, and structural issues before you send a campaign.",
      "Always validate before a major broadcast — it is much cheaper to fix rows in Sheets than to recover from failed sends.",
    ],
    keywords: ["validate", "validation", "errors", "phone", "check"],
    relatedLinks: [{ href: "/contacts", label: "Validate from Contacts" }],
  },
  {
    id: "multiple-sheets",
    category: "contacts",
    question: "Can I use more than one Google Sheet for contacts?",
    answer: [
      "Yes. sheets.config.json supports multiple contact sources, each with its own spreadsheet, tab, and column mapping.",
      "The dashboard merges all sources in Contacts and tags each row with its source label. Custom schemas like Google Contacts export formats are supported via headers and columns config.",
    ],
    bullets: [
      "hewane — standard Hewane column layout",
      "google-contacts — Google Contacts CSV/export style columns",
      "custom — fully manual column mapping",
    ],
    keywords: ["multiple", "sheets", "sources", "config", "schema"],
    relatedLinks: [{ href: "/settings", label: "View connected sheets" }],
  },
  {
    id: "broadcast-start",
    category: "broadcast",
    question: "How do I send a WhatsApp broadcast?",
    answer: [
      "Go to Broadcast, name your campaign, choose a template or custom message, select a contact group, and pick a delivery speed.",
      "Careful mode sends slower (safer for large lists). Standard is the default balance. Fast is for urgent, smaller groups.",
    ],
    bullets: [
      "Template mode sends templateId + message body to n8n",
      "Custom mode sends your free-text message only",
      "Email fallback sends email when WhatsApp is unavailable (if configured in n8n)",
    ],
    keywords: ["send", "whatsapp", "campaign", "start", "broadcast"],
    relatedLinks: [{ href: "/broadcast", label: "Broadcast page" }],
  },
  {
    id: "broadcast-pause-stop",
    category: "broadcast",
    question: "Can I pause or stop a running campaign?",
    answer: [
      "Yes, when n8n returns an execution ID and N8N_API_KEY is configured on the server. Pause and Stop buttons appear while a campaign is running.",
      "If controls are unavailable, the workflow may have finished instantly or the API key is missing — check with your administrator.",
    ],
    keywords: ["pause", "stop", "cancel", "execution", "n8n"],
    relatedLinks: [{ href: "/broadcast", label: "Broadcast controls" }],
  },
  {
    id: "delivery-speed",
    category: "broadcast",
    question: "Which delivery speed should I choose?",
    answer: [
      "Delivery speed controls how fast n8n sends messages to avoid WhatsApp rate limits and account flags.",
    ],
    bullets: [
      "Careful — 5s delay, 25 messages per batch (safest for large lists)",
      "Standard — 3s delay, 50 per batch (recommended default)",
      "Fast — 1s delay, 100 per batch (small urgent groups only)",
    ],
    keywords: ["speed", "rate", "limit", "careful", "standard", "fast"],
  },
  {
    id: "template-variables",
    category: "templates",
    question: "What variables can I use in templates?",
    answer: [
      "Templates support placeholders that n8n replaces per contact when sending.",
    ],
    bullets: [
      "{{name}} — contact name from the sheet",
      "{{segment}} — contact segment (Students, Parents, etc.)",
      "{{1}}, {{2}} — custom numbered placeholders",
    ],
    keywords: ["variables", "placeholders", "personalization", "merge"],
    relatedLinks: [{ href: "/templates", label: "Templates" }],
  },
  {
    id: "template-use-broadcast",
    category: "templates",
    question: "How do I use a template in a broadcast?",
    answer: [
      "On the Templates page, click Use on any template card — it opens Broadcast with that template pre-selected.",
      "Alternatively, open Broadcast, set message type to Use template, and pick from the dropdown.",
    ],
    keywords: ["use template", "broadcast", "link"],
    relatedLinks: [
      { href: "/templates", label: "Templates" },
      { href: "/broadcast", label: "Broadcast" },
    ],
  },
  {
    id: "analytics-data",
    category: "analytics",
    question: "Where does analytics data come from?",
    answer: [
      "Campaign metrics are read from the Analytics tab on your configured Google Sheet. Each broadcast row includes sent, delivered, failed counts and success rate.",
      "If Analytics is empty, campaigns may not be writing back yet — confirm n8n Workflow B logs results and the Analytics tab exists on your primary spreadsheet.",
    ],
    keywords: ["analytics", "metrics", "data", "source"],
    relatedLinks: [{ href: "/analytics", label: "Analytics" }],
  },
  {
    id: "export-reports",
    category: "analytics",
    question: "How do I export campaign reports?",
    answer: [
      "On the Analytics page, use CSV, Excel, or PDF export buttons. Files download to your browser with campaign history from the sheet.",
    ],
    keywords: ["export", "csv", "excel", "pdf", "download"],
    relatedLinks: [{ href: "/analytics", label: "Export from Analytics" }],
  },
  {
    id: "settings-save",
    category: "settings",
    question: "What do Settings save?",
    answer: [
      "Organization name, timezone, and notification preferences are stored locally in your browser (localStorage) on this device.",
      "Spreadsheet configuration comes from sheets.config.json on the server — contact your administrator to add or change sheet sources.",
      "WhatsApp number and admin email display read-only values from system configuration.",
    ],
    keywords: ["settings", "save", "preferences", "local"],
    relatedLinks: [{ href: "/settings", label: "Settings" }],
  },
  {
    id: "sync-health",
    category: "troubleshooting",
    question: "Dashboard shows sync health as warning or error — what should I do?",
    answer: [
      "Sync health reflects how recently contacts were synced and whether the last sync succeeded.",
    ],
    bullets: [
      "Open Contacts and click Sync Sheets",
      "Verify Google service account has Editor access on every spreadsheet",
      "Confirm N8N_WORKFLOW_A_URL is correct and n8n workflow is active",
      "Check tab names in sheets.config.json match your actual sheet tabs",
    ],
    keywords: ["sync health", "warning", "error", "failed"],
    relatedLinks: [{ href: "/contacts", label: "Try sync" }],
  },
  {
    id: "login-fails",
    category: "troubleshooting",
    question: "I cannot sign in — what should I check?",
    answer: [
      "Sign-in requires a working PostgreSQL database and correct Better Auth environment variables.",
    ],
    bullets: [
      "DATABASE_URL points to a reachable database",
      "BETTER_AUTH_SECRET is set (32+ char random string)",
      "BETTER_AUTH_URL matches the URL in your browser exactly",
      "Your account exists — ask admin or run pnpm db:setup for seed user",
    ],
    keywords: ["login", "sign in", "password", "database", "auth error"],
  },
  {
    id: "broadcast-fails",
    category: "troubleshooting",
    question: "Broadcast failed to start — common causes",
    answer: [
      "When Start broadcast returns an error, work through these checks in order.",
    ],
    bullets: [
      "N8N_WORKFLOW_B_URL is set and the n8n workflow is published",
      "n8n has valid Meta/WhatsApp credentials and phone number ID",
      "Contacts exist for the selected group with valid E.164 phones",
      "Campaign name and message (or template) are filled in",
      "Check server logs and n8n execution history for detailed errors",
    ],
    keywords: ["broadcast failed", "error", "n8n", "whatsapp"],
    relatedLinks: [{ href: "/broadcast", label: "Broadcast" }],
  },
  {
    id: "templates-empty",
    category: "troubleshooting",
    question: "Templates page is empty or create fails",
    answer: [
      "Templates are stored in a Templates tab on your primary spreadsheet. If templates array in sheets.config.json is empty, the app falls back to primarySpreadsheetId.",
      "Create a Templates tab with columns: id, name, body, variables, createdAt, lastUsed — or ask your administrator to add templates config.",
    ],
    keywords: ["templates empty", "create failed", "sheet tab"],
    relatedLinks: [{ href: "/templates", label: "Templates" }],
  },
  {
    id: "contacts-filter-loop",
    category: "troubleshooting",
    question: "Contacts page keeps refreshing endlessly",
    answer: [
      "This was caused by unstable toast dependencies in an earlier version and has been fixed. If you still see it, hard-refresh the browser (Ctrl+Shift+R) and ensure you are on the latest build.",
      "If filters cause repeated fetches, clear all filters using the reset control and try again.",
    ],
    keywords: ["infinite", "loop", "refresh", "loading"],
    relatedLinks: [{ href: "/contacts", label: "Contacts" }],
  },
  {
    id: "get-support",
    category: "troubleshooting",
    question: "Who do I contact for help?",
    answer: [
      "For dashboard access, sheet configuration, or n8n/WhatsApp setup, contact your Hewane system administrator.",
      "Support email: support@hewane.com — include screenshots, the page you were on, and the time the issue occurred.",
    ],
    keywords: ["support", "help", "contact", "admin"],
  },
];

export function filterHelpArticles(query: string, category: HelpCategory | "all"): HelpArticle[] {
  const normalized = query.trim().toLowerCase();

  return HELP_ARTICLES.filter((article) => {
    if (category !== "all" && article.category !== category) return false;
    if (!normalized) return true;

    const haystack = [
      article.question,
      ...article.answer,
      ...(article.bullets ?? []),
      ...article.keywords,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });
}

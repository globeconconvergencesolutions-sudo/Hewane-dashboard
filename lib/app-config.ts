export function isSignUpDisabled(): boolean {
  return process.env.DISABLE_SIGNUP === "true";
}

/** Sync workflow — hewane-sheets-sync (n8n Multi-Sheet Sync) */
export function getN8nSyncWebhookUrl(): string | null {
  const url = process.env.N8N_WORKFLOW_A_URL?.trim();
  return url || null;
}

/** Validate workflow — hewane-validate (dedicated validation workflow) */
export function getN8nValidateWebhookUrl(): string | null {
  const dedicated = process.env.N8N_VALIDATE_WEBHOOK_URL?.trim();
  if (dedicated) return dedicated;
  return null;
}

/** Broadcast workflow — hewane-broadcast-trigger (n8n WhatsApp Broadcast) */
export function getN8nBroadcastWebhookUrl(): string | null {
  const url = process.env.N8N_WORKFLOW_B_URL?.trim();
  return url || null;
}

export function isN8nSyncConfigured(): boolean {
  return Boolean(getN8nSyncWebhookUrl());
}

export function isN8nValidateConfigured(): boolean {
  return Boolean(getN8nValidateWebhookUrl());
}

export function isN8nBroadcastConfigured(): boolean {
  return Boolean(getN8nBroadcastWebhookUrl());
}

export type IntegrationsStatus = {
  signUpDisabled: boolean;
  sheets: {
    configured: boolean;
  };
  n8n: {
    syncConfigured: boolean;
    validateConfigured: boolean;
    broadcastConfigured: boolean;
    baseUrlConfigured: boolean;
    syncWebhookUrl: string | null;
    validateWebhookUrl: string | null;
    broadcastWebhookUrl: string | null;
    syncDisabledReason: string | null;
    validateDisabledReason: string | null;
    broadcastDisabledReason: string | null;
  };
};

export function getIntegrationsStatus(sheetsConfigured: boolean): IntegrationsStatus {
  const syncUrl = getN8nSyncWebhookUrl();
  const validateUrl = getN8nValidateWebhookUrl();
  const broadcastUrl = getN8nBroadcastWebhookUrl();
  const baseUrl = process.env.N8N_BASE_URL?.trim();

  let syncDisabledReason: string | null = null;
  if (!syncUrl) {
    syncDisabledReason = "N8N_WORKFLOW_A_URL is not configured (hewane-sheets-sync).";
  } else if (!sheetsConfigured) {
    syncDisabledReason = "Google Sheets is not configured.";
  }

  let validateDisabledReason: string | null = null;
  if (!validateUrl) {
    validateDisabledReason = "N8N_VALIDATE_WEBHOOK_URL is not configured (hewane-validate).";
  } else if (!sheetsConfigured) {
    validateDisabledReason = "Google Sheets is not configured.";
  }

  let broadcastDisabledReason: string | null = null;
  if (!broadcastUrl) {
    broadcastDisabledReason = "N8N_WORKFLOW_B_URL is not configured (hewane-broadcast-trigger).";
  } else if (!sheetsConfigured) {
    broadcastDisabledReason = "Google Sheets is not configured.";
  }

  return {
    signUpDisabled: isSignUpDisabled(),
    sheets: { configured: sheetsConfigured },
    n8n: {
      syncConfigured: Boolean(syncUrl),
      validateConfigured: Boolean(validateUrl),
      broadcastConfigured: Boolean(broadcastUrl),
      baseUrlConfigured: Boolean(baseUrl),
      syncWebhookUrl: syncUrl,
      validateWebhookUrl: validateUrl,
      broadcastWebhookUrl: broadcastUrl,
      syncDisabledReason,
      validateDisabledReason,
      broadcastDisabledReason,
    },
  };
}

export function isSignUpDisabled(): boolean {
  return process.env.DISABLE_SIGNUP === "true";
}

export function getN8nSyncWebhookUrl(): string | null {
  const url = process.env.N8N_WORKFLOW_A_URL?.trim();
  return url || null;
}

export function getN8nBroadcastWebhookUrl(): string | null {
  const url = process.env.N8N_WORKFLOW_B_URL?.trim();
  return url || null;
}

export function isN8nSyncConfigured(): boolean {
  return Boolean(getN8nSyncWebhookUrl());
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
    broadcastConfigured: boolean;
    baseUrlConfigured: boolean;
    syncWebhookUrl: string | null;
    broadcastWebhookUrl: string | null;
    /** Human-readable reason when sync/validate actions should be disabled */
    syncDisabledReason: string | null;
    broadcastDisabledReason: string | null;
  };
};

export function getIntegrationsStatus(sheetsConfigured: boolean): IntegrationsStatus {
  const syncUrl = getN8nSyncWebhookUrl();
  const broadcastUrl = getN8nBroadcastWebhookUrl();
  const baseUrl = process.env.N8N_BASE_URL?.trim();

  let syncDisabledReason: string | null = null;
  if (!syncUrl) {
    syncDisabledReason = "N8N_WORKFLOW_A_URL is not configured.";
  } else if (!sheetsConfigured) {
    syncDisabledReason = "Google Sheets is not configured.";
  }

  let broadcastDisabledReason: string | null = null;
  if (!broadcastUrl) {
    broadcastDisabledReason = "N8N_WORKFLOW_B_URL is not configured.";
  } else if (!sheetsConfigured) {
    broadcastDisabledReason = "Google Sheets is not configured.";
  }

  return {
    signUpDisabled: isSignUpDisabled(),
    sheets: { configured: sheetsConfigured },
    n8n: {
      syncConfigured: Boolean(syncUrl),
      broadcastConfigured: Boolean(broadcastUrl),
      baseUrlConfigured: Boolean(baseUrl),
      syncWebhookUrl: syncUrl,
      broadcastWebhookUrl: broadcastUrl,
      syncDisabledReason,
      broadcastDisabledReason,
    },
  };
}

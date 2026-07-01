import {
  areMetaWhatsAppCredentialsReady,
  getMetaWhatsAppCredentialIssues,
  hasPlaceholderMetaWhatsAppCredentials,
} from "@/lib/meta-whatsapp-credentials";
import type { MetaWhatsAppVerificationResult } from "@/lib/meta-whatsapp-verification";
import { getMetaWhatsAppVerificationStatus } from "@/lib/meta-whatsapp-verification";

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

/** Meta WhatsApp Business API (template management) */
export function getWhatsAppWabaId(): string | null {
  return process.env.WHATSAPP_WABA_ID?.trim() || null;
}

export function getWhatsAppAccessToken(): string | null {
  return process.env.WHATSAPP_ACCESS_TOKEN?.trim() || null;
}

export function getWhatsAppGraphVersion(): string {
  return process.env.WHATSAPP_GRAPH_VERSION?.trim() || "v21.0";
}

export function isMetaWhatsAppConfigured(): boolean {
  return areMetaWhatsAppCredentialsReady(getWhatsAppWabaId(), getWhatsAppAccessToken());
}

export function getMetaWhatsAppDisabledMessage(): string | null {
  const issues = getMetaWhatsAppCredentialIssues(getWhatsAppWabaId(), getWhatsAppAccessToken());
  return issues[0] ?? null;
}

export type MetaWhatsAppConnectionStatus =
  | "not_configured"
  | "placeholder"
  | "failed"
  | "connected";

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
  meta: {
    wabaIdConfigured: boolean;
    accessTokenConfigured: boolean;
    hasPlaceholderCredentials: boolean;
    credentialsReady: boolean;
    verified: boolean;
    verifiedAt: string | null;
    verifyError: string | null;
    wabaName: string | null;
    connectionStatus: MetaWhatsAppConnectionStatus;
    canSubmitTemplates: boolean;
    disabledReason: string | null;
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

  const wabaId = getWhatsAppWabaId();
  const accessToken = getWhatsAppAccessToken();
  const credentialIssues = getMetaWhatsAppCredentialIssues(wabaId, accessToken);
  const credentialsReady = credentialIssues.length === 0;
  const hasPlaceholderCredentials = hasPlaceholderMetaWhatsAppCredentials(wabaId, accessToken);

  let metaDisabledReason: string | null = null;
  if (credentialIssues.length > 0) {
    metaDisabledReason = credentialIssues[0];
  }

  return buildIntegrationsStatus({
    signUpDisabled: isSignUpDisabled(),
    sheetsConfigured,
    wabaId,
    accessToken,
    credentialsReady,
    hasPlaceholderCredentials,
    metaDisabledReason,
    syncUrl,
    validateUrl,
    broadcastUrl,
    baseUrl,
    syncDisabledReason,
    validateDisabledReason,
    broadcastDisabledReason,
  });
}

export async function getIntegrationsStatusWithVerification(
  sheetsConfigured: boolean,
  forceVerify = false
): Promise<IntegrationsStatus> {
  const base = getIntegrationsStatus(sheetsConfigured);
  if (!base.meta.credentialsReady) {
    return base;
  }

  const verification = await getMetaWhatsAppVerificationStatus(forceVerify);

  return buildIntegrationsStatus({
    signUpDisabled: base.signUpDisabled,
    sheetsConfigured: base.sheets.configured,
    wabaId: getWhatsAppWabaId(),
    accessToken: getWhatsAppAccessToken(),
    credentialsReady: base.meta.credentialsReady,
    hasPlaceholderCredentials: base.meta.hasPlaceholderCredentials,
    metaDisabledReason: base.meta.disabledReason,
    syncUrl: base.n8n.syncWebhookUrl,
    validateUrl: base.n8n.validateWebhookUrl,
    broadcastUrl: base.n8n.broadcastWebhookUrl,
    baseUrl: process.env.N8N_BASE_URL?.trim(),
    syncDisabledReason: base.n8n.syncDisabledReason,
    validateDisabledReason: base.n8n.validateDisabledReason,
    broadcastDisabledReason: base.n8n.broadcastDisabledReason,
    verification,
  });
}

function resolveMetaConnectionStatus(input: {
  wabaIdConfigured: boolean;
  accessTokenConfigured: boolean;
  hasPlaceholderCredentials: boolean;
  credentialsReady: boolean;
  verification: MetaWhatsAppVerificationResult;
}): MetaWhatsAppConnectionStatus {
  if (!input.wabaIdConfigured && !input.accessTokenConfigured) {
    return "not_configured";
  }
  if (input.hasPlaceholderCredentials || !input.credentialsReady) {
    return "placeholder";
  }
  if (input.verification.verified) {
    return "connected";
  }
  return "failed";
}

export function buildIntegrationsStatus(input: {
  signUpDisabled: boolean;
  sheetsConfigured: boolean;
  wabaId: string | null;
  accessToken: string | null;
  credentialsReady: boolean;
  hasPlaceholderCredentials: boolean;
  metaDisabledReason: string | null;
  syncUrl: string | null;
  validateUrl: string | null;
  broadcastUrl: string | null;
  baseUrl: string | undefined;
  syncDisabledReason: string | null;
  validateDisabledReason: string | null;
  broadcastDisabledReason: string | null;
  verification?: MetaWhatsAppVerificationResult;
}): IntegrationsStatus {
  const verification = input.verification ?? {
    verified: false,
    verifiedAt: null,
    verifyError: null,
    wabaName: null,
    wabaId: null,
  };

  const wabaIdConfigured = Boolean(input.wabaId);
  const accessTokenConfigured = Boolean(input.accessToken);
  const connectionStatus = resolveMetaConnectionStatus({
    wabaIdConfigured,
    accessTokenConfigured,
    hasPlaceholderCredentials: input.hasPlaceholderCredentials,
    credentialsReady: input.credentialsReady,
    verification,
  });

  const canSubmitTemplates = input.credentialsReady && verification.verified;

  let metaDisabledReason = input.metaDisabledReason;
  if (!metaDisabledReason && input.credentialsReady && !verification.verified) {
    metaDisabledReason =
      verification.verifyError ??
      "Meta WhatsApp credentials are set but not verified. Run Test connection in Settings.";
  }

  return {
    signUpDisabled: input.signUpDisabled,
    sheets: { configured: input.sheetsConfigured },
    meta: {
      wabaIdConfigured,
      accessTokenConfigured,
      hasPlaceholderCredentials: input.hasPlaceholderCredentials,
      credentialsReady: input.credentialsReady,
      verified: verification.verified,
      verifiedAt: verification.verifiedAt,
      verifyError: verification.verifyError,
      wabaName: verification.wabaName,
      connectionStatus,
      canSubmitTemplates,
      disabledReason: metaDisabledReason,
    },
    n8n: {
      syncConfigured: Boolean(input.syncUrl),
      validateConfigured: Boolean(input.validateUrl),
      broadcastConfigured: Boolean(input.broadcastUrl),
      baseUrlConfigured: Boolean(input.baseUrl),
      syncWebhookUrl: input.syncUrl,
      validateWebhookUrl: input.validateUrl,
      broadcastWebhookUrl: input.broadcastUrl,
      syncDisabledReason: input.syncDisabledReason,
      validateDisabledReason: input.validateDisabledReason,
      broadcastDisabledReason: input.broadcastDisabledReason,
    },
  };
}

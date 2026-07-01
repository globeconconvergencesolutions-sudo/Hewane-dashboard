import type { IntegrationsStatus } from "@/lib/app-config";

export function metaWhatsAppStatusLabel(status: IntegrationsStatus["meta"]["connectionStatus"]) {
  switch (status) {
    case "connected":
      return "Connected";
    case "placeholder":
      return "Placeholder credentials";
    case "failed":
      return "Connection failed";
    default:
      return "Not configured";
  }
}

export function metaWhatsAppStatusDescription(meta: IntegrationsStatus["meta"]) {
  switch (meta.connectionStatus) {
    case "connected":
      return meta.wabaName
        ? `Verified with Meta Graph API (${meta.wabaName}). Template submit and status sync are available.`
        : "Verified with Meta Graph API. Template submit and status sync are available.";
    case "placeholder":
      return "Environment variables are set to example or invalid placeholder values. Replace them with real Meta credentials, then test the connection.";
    case "failed":
      return (
        meta.verifyError ??
        "Credentials are present but Meta rejected the connection test. Check your WABA ID, token permissions, and expiry."
      );
    default:
      return "Set WHATSAPP_WABA_ID and WHATSAPP_ACCESS_TOKEN on the server to submit templates to Meta for review.";
  }
}

export function metaWhatsAppBannerTitle(meta: IntegrationsStatus["meta"]) {
  switch (meta.connectionStatus) {
    case "connected":
      return "Meta WhatsApp connected";
    case "placeholder":
      return "Meta WhatsApp credentials need real values";
    case "failed":
      return "Meta WhatsApp connection failed";
    default:
      return "Meta WhatsApp not configured";
  }
}

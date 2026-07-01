const EXACT_PLACEHOLDER_VALUES = new Set([
  "your_waba_id",
  "your_system_user_access_token",
  "your-access-token",
  "your-waba-id",
  "changeme",
  "placeholder",
  "example",
  "todo",
  "replace_me",
  "insert_here",
])

const PLACEHOLDER_PATTERNS = [
  /^your[_-]?waba/i,
  /^your[_-]?system[_-]?user/i,
  /^your[_-]?access[_-]?token/i,
  /^<.*>$/,
  /^\*\*\*$/,
]

function normalize(value: string | null | undefined): string {
  return value?.trim() ?? ""
}

export function isPlaceholderMetaCredential(
  value: string | null | undefined,
  kind: "waba" | "token"
): boolean {
  const normalized = normalize(value).toLowerCase()
  if (!normalized) return true

  if (EXACT_PLACEHOLDER_VALUES.has(normalized)) return true
  if (PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(normalized))) return true

  if (kind === "token" && normalized.length < 32) return true
  if (kind === "waba" && !/^\d{8,}$/.test(normalized)) return true

  return false
}

export function getMetaWhatsAppCredentialIssues(wabaId: string | null, accessToken: string | null) {
  const issues: string[] = []

  if (!normalize(wabaId)) {
    issues.push("WHATSAPP_WABA_ID is not configured.")
  } else if (isPlaceholderMetaCredential(wabaId, "waba")) {
    issues.push("WHATSAPP_WABA_ID looks like a placeholder — set your real WhatsApp Business Account ID.")
  }

  if (!normalize(accessToken)) {
    issues.push("WHATSAPP_ACCESS_TOKEN is not configured.")
  } else if (isPlaceholderMetaCredential(accessToken, "token")) {
    issues.push(
      "WHATSAPP_ACCESS_TOKEN looks like a placeholder — set a real Meta system user token with whatsapp_business_management."
    )
  }

  return issues
}

export function areMetaWhatsAppCredentialsReady(wabaId: string | null, accessToken: string | null): boolean {
  return getMetaWhatsAppCredentialIssues(wabaId, accessToken).length === 0
}

export function hasPlaceholderMetaWhatsAppCredentials(
  wabaId: string | null,
  accessToken: string | null
): boolean {
  const waba = normalize(wabaId)
  const token = normalize(accessToken)
  if (!waba && !token) return false

  return (
    (Boolean(waba) && isPlaceholderMetaCredential(waba, "waba")) ||
    (Boolean(token) && isPlaceholderMetaCredential(token, "token"))
  )
}

import {
  getWhatsAppAccessToken,
  getWhatsAppGraphVersion,
  getWhatsAppWabaId,
} from "@/lib/app-config"
import { areMetaWhatsAppCredentialsReady } from "@/lib/meta-whatsapp-credentials"
import { parseMetaError } from "@/lib/meta-whatsapp"
import logger, { errorLogger } from "@/lib/logger"

const VERIFY_CACHE_TTL_MS = 5 * 60 * 1000

export type MetaWhatsAppVerificationResult = {
  verified: boolean
  verifiedAt: string | null
  verifyError: string | null
  wabaName: string | null
  wabaId: string | null
}

type VerificationCacheEntry = MetaWhatsAppVerificationResult & {
  expiresAt: number
}

let verificationCache: VerificationCacheEntry | null = null

function emptyVerification(error: string | null = null): MetaWhatsAppVerificationResult {
  return {
    verified: false,
    verifiedAt: null,
    verifyError: error,
    wabaName: null,
    wabaId: null,
  }
}

export function clearMetaWhatsAppVerificationCache() {
  verificationCache = null
}

export async function verifyMetaWhatsAppConnection(): Promise<MetaWhatsAppVerificationResult> {
  const wabaId = getWhatsAppWabaId()
  const accessToken = getWhatsAppAccessToken()

  if (!areMetaWhatsAppCredentialsReady(wabaId, accessToken)) {
    return emptyVerification("Meta WhatsApp credentials are missing or still use placeholder values.")
  }

  const version = getWhatsAppGraphVersion()
  const url = `https://graph.facebook.com/${version}/${wabaId}?fields=id,name`

  logger.debug("[Meta] Verifying WhatsApp connection", { wabaId })

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    })

    const text = await response.text()
    let data: unknown
    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      data = { raw: text }
    }

    if (!response.ok) {
      const message = parseMetaError(data, `Meta API error (${response.status})`)
      errorLogger("[Meta] Verification failed", { status: response.status, message })
      return emptyVerification(message)
    }

    const payload = data as { id?: string; name?: string }
    const verifiedAt = new Date().toISOString()

    logger.info("[Meta] WhatsApp connection verified", {
      wabaId: payload.id ?? wabaId,
      wabaName: payload.name ?? null,
    })

    return {
      verified: true,
      verifiedAt,
      verifyError: null,
      wabaName: payload.name ?? null,
      wabaId: payload.id ?? wabaId,
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.includes("fetch failed")
          ? "Could not reach Meta Graph API. Check your network and token."
          : error.message
        : "Meta verification failed"
    errorLogger("[Meta] Verification error", error)
    return emptyVerification(message)
  }
}

export async function getMetaWhatsAppVerificationStatus(
  force = false
): Promise<MetaWhatsAppVerificationResult> {
  const wabaId = getWhatsAppWabaId()
  const accessToken = getWhatsAppAccessToken()

  if (!areMetaWhatsAppCredentialsReady(wabaId, accessToken)) {
    clearMetaWhatsAppVerificationCache()
    return emptyVerification(null)
  }

  const now = Date.now()
  if (!force && verificationCache && verificationCache.expiresAt > now) {
    return {
      verified: verificationCache.verified,
      verifiedAt: verificationCache.verifiedAt,
      verifyError: verificationCache.verifyError,
      wabaName: verificationCache.wabaName,
      wabaId: verificationCache.wabaId,
    }
  }

  const result = await verifyMetaWhatsAppConnection()
  verificationCache = {
    ...result,
    expiresAt: now + VERIFY_CACHE_TTL_MS,
  }

  return result
}

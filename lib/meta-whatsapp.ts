import logger, { errorLogger } from "@/lib/logger";
import {
  getWhatsAppAccessToken,
  getWhatsAppGraphVersion,
  getWhatsAppWabaId,
  getMetaWhatsAppDisabledMessage,
  isMetaWhatsAppConfigured,
} from "@/lib/app-config";
import type { WhatsAppTemplateCategory } from "@/lib/whatsapp-template-types";

export type MetaTemplateComponent = {
  type: "BODY";
  text: string;
  example?: {
    body_text: string[][];
  };
};

export type MetaMessageTemplate = {
  id: string;
  name: string;
  status: string;
  language: string;
  category: string;
  rejected_reason?: string;
  components?: { type: string; text?: string }[];
};

type MetaGraphError = {
  error?: {
    message?: string;
    code?: number;
    error_user_msg?: string;
  };
};

function graphBaseUrl(): string {
  const version = getWhatsAppGraphVersion();
  return `https://graph.facebook.com/${version}`;
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${getWhatsAppAccessToken()}`,
    "Content-Type": "application/json",
  };
}

export function assertMetaWhatsAppConfigured(): void {
  if (!isMetaWhatsAppConfigured()) {
    throw new Error(
      getMetaWhatsAppDisabledMessage() ??
        "Meta WhatsApp is not configured. Set WHATSAPP_WABA_ID and WHATSAPP_ACCESS_TOKEN on the server."
    );
  }
}

export function parseMetaError(body: unknown, fallback: string): string {
  const err = body as MetaGraphError;
  return err?.error?.error_user_msg || err?.error?.message || fallback;
}

async function metaFetch<T>(path: string, init?: RequestInit): Promise<T> {
  assertMetaWhatsAppConfigured();
  const url = `${graphBaseUrl()}${path}`;
  logger.debug("[Meta] Request", { path, method: init?.method ?? "GET" });

  const response = await fetch(url, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const message = parseMetaError(data, `Meta API error (${response.status})`);
    errorLogger("[Meta] API error", { path, status: response.status, message, data });
    throw new Error(message);
  }

  return data as T;
}

export async function createMessageTemplate(input: {
  name: string;
  language: string;
  category: WhatsAppTemplateCategory;
  body: string;
  exampleValues: string[];
}): Promise<{ id: string; status: string }> {
  const wabaId = getWhatsAppWabaId()!;

  const components: MetaTemplateComponent[] = [
    {
      type: "BODY",
      text: input.body,
      example: {
        body_text: [input.exampleValues],
      },
    },
  ];

  const result = await metaFetch<{ id: string; status: string }>(`/${wabaId}/message_templates`, {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      language: input.language,
      category: input.category,
      components,
    }),
  });

  logger.info("[Meta] Template submitted", { name: input.name, id: result.id, status: result.status });
  return result;
}

export async function listMessageTemplates(name?: string): Promise<MetaMessageTemplate[]> {
  const wabaId = getWhatsAppWabaId()!;
  const fields = "id,name,status,language,category,rejected_reason,components";
  const params = new URLSearchParams({ fields, limit: "100" });
  if (name) params.set("name", name);

  const result = await metaFetch<{ data: MetaMessageTemplate[] }>(
    `/${wabaId}/message_templates?${params.toString()}`
  );

  return result.data ?? [];
}

export async function getMessageTemplateByName(name: string): Promise<MetaMessageTemplate | null> {
  const templates = await listMessageTemplates(name);
  return templates.find((t) => t.name === name) ?? templates[0] ?? null;
}

export function mapMetaStatusToLocal(
  metaStatus: string
): "pending" | "approved" | "rejected" | "paused" {
  const normalized = metaStatus.toUpperCase();
  if (normalized === "APPROVED") return "approved";
  if (normalized === "REJECTED") return "rejected";
  if (normalized === "PAUSED" || normalized === "DISABLED") return "paused";
  return "pending";
}

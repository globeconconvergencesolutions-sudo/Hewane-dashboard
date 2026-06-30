import type {
  VariableMapping,
  VariableSource,
  WhatsAppTemplateCategory,
} from "@/lib/whatsapp-template-types";

export const DEFAULT_WHATSAPP_TEMPLATE_CATEGORY: WhatsAppTemplateCategory = "MARKETING";
export const DEFAULT_WHATSAPP_TEMPLATE_LANGUAGE = "en_US";

const META_NAME_PATTERN = /^[a-z0-9_]{1,512}$/;

export function extractMetaVariables(body: string): string[] {
  const matches = body.match(/\{\{\d+\}\}/g) ?? [];
  const ordered = [...new Set(matches)].sort((a, b) => {
    const na = Number(a.replace(/\D/g, ""));
    const nb = Number(b.replace(/\D/g, ""));
    return na - nb;
  });
  return ordered;
}

export function slugifyMetaTemplateName(displayName: string): string {
  const slug = displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 512);

  return slug || "hewane_template";
}

export function isValidMetaTemplateName(name: string): boolean {
  return META_NAME_PATTERN.test(name);
}

export function defaultSourceForVariable(meta: string): VariableSource {
  const index = Number(meta.replace(/\D/g, ""));
  if (index === 1) return "name";
  if (index === 2) return "segment";
  return "custom";
}

export function buildDefaultVariableMapping(body: string): VariableMapping[] {
  return extractMetaVariables(body).map((meta) => ({
    meta,
    source: defaultSourceForVariable(meta),
  }));
}

export function buildDefaultExampleValues(
  variableMapping: VariableMapping[],
  provided?: string[]
): string[] {
  if (provided && provided.length > 0) return provided;

  return variableMapping.map((entry, index) => {
    if (entry.source === "name") return "John";
    if (entry.source === "segment") return "Students";
    return `Sample ${index + 1}`;
  });
}

export function validateTemplateDraft(input: {
  displayName: string;
  metaTemplateName: string;
  body: string;
  exampleValues: string[];
  variableMapping: VariableMapping[];
}): string | null {
  if (!input.displayName.trim()) return "Display name is required.";
  if (!input.body.trim()) return "Message body is required.";
  if (!isValidMetaTemplateName(input.metaTemplateName)) {
    return "Meta template name must be lowercase letters, numbers, and underscores only.";
  }

  const variables = extractMetaVariables(input.body);
  if (variables.length !== input.exampleValues.length) {
    return `Provide one example value for each variable (${variables.length} required).`;
  }

  if (variables.length !== input.variableMapping.length) {
    return "Variable mapping must match every {{1}}, {{2}}, … placeholder in the body.";
  }

  for (const value of input.exampleValues) {
    if (!value.trim()) return "Example values cannot be empty.";
  }

  return null;
}

export function resolveVariableValue(
  mapping: VariableMapping,
  contact: { name: string; segment: string }
): string {
  if (mapping.source === "name") return contact.name;
  if (mapping.source === "segment") return contact.segment;
  return mapping.customValue ?? "";
}

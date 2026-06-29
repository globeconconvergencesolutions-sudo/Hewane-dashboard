export type ValidationInvalidRow = {
  row: number;
  name: string;
  rawPhone: string;
  issue: string;
};

export type ValidationDupeRow = {
  row?: number;
  name?: string;
  rawPhone?: string;
  issue?: string;
  [key: string]: unknown;
};

export type ValidationSourceReport = {
  label: string;
  spreadsheetId: string;
  tab: string;
  schema?: string;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  dupeCount: number;
  invalid: ValidationInvalidRow[];
  dupes: ValidationDupeRow[];
  sampleValid: Array<Record<string, unknown>>;
};

export type ContactValidationReport = {
  validatedAt: string;
  overallHealth: string;
  valid: boolean;
  summary: {
    totalContacts: number;
    validContacts: number;
    invalidContacts: number;
    duplicates: number;
    sourcesChecked: number;
  };
  sources: ValidationSourceReport[];
};

function isNewValidationShape(data: Record<string, unknown>): boolean {
  return Boolean(data.summary && data.sources && data.overallHealth);
}

/** Normalize n8n validate webhook JSON into a dashboard-friendly report. */
export function parseN8nValidationResponse(raw: unknown): ContactValidationReport {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  if (isNewValidationShape(data)) {
    const summary = data.summary as ContactValidationReport["summary"];
    const sources = (data.sources as ValidationSourceReport[]) ?? [];
    const invalidContacts = summary?.invalidContacts ?? 0;
    const duplicates = summary?.duplicates ?? 0;

    return {
      validatedAt: String(data.validatedAt ?? new Date().toISOString()),
      overallHealth: String(data.overallHealth ?? ""),
      valid: invalidContacts === 0 && duplicates === 0,
      summary: {
        totalContacts: summary?.totalContacts ?? 0,
        validContacts: summary?.validContacts ?? 0,
        invalidContacts,
        duplicates,
        sourcesChecked: summary?.sourcesChecked ?? sources.length,
      },
      sources,
    };
  }

  // Legacy shape (single combined invalidContacts list)
  const invalidContacts = (data.invalidContacts as Array<{
    row: number;
    name: string;
    phone: string;
    errors: string[];
    source?: string;
  }>) ?? [];
  const invalidCount = Number(data.invalidCount ?? invalidContacts.length);

  const sources: ValidationSourceReport[] = [];
  for (const item of invalidContacts) {
    const label = item.source ?? "Unknown source";
    let source = sources.find((s) => s.label === label);
    if (!source) {
      source = {
        label,
        spreadsheetId: "",
        tab: "",
        totalRows: 0,
        validCount: 0,
        invalidCount: 0,
        dupeCount: 0,
        invalid: [],
        dupes: [],
        sampleValid: [],
      };
      sources.push(source);
    }
    for (const err of item.errors ?? []) {
      source.invalid.push({
        row: item.row,
        name: item.name,
        rawPhone: item.phone,
        issue: err,
      });
    }
    source.invalidCount = source.invalid.length;
  }

  return {
    validatedAt: new Date().toISOString(),
    overallHealth:
      invalidCount === 0 ? "All contacts look good ✅" : `${invalidCount} issue(s) found ❌`,
    valid: invalidCount === 0,
    summary: {
      totalContacts: invalidCount,
      validContacts: 0,
      invalidContacts: invalidCount,
      duplicates: 0,
      sourcesChecked: sources.length || 1,
    },
    sources,
  };
}

export function healthTone(overallHealth: string, valid: boolean): "success" | "warning" | "danger" {
  if (valid) return "success";
  const lower = overallHealth.toLowerCase();
  if (lower.includes("warning") || lower.includes("minor")) return "warning";
  return "danger";
}

import type { ContactValidationReport } from "@/lib/validation";

const STORAGE_KEY = "hewane-validation-report";

/** How long a passing validation is considered fresh for broadcast gating. */
export const VALIDATION_FRESH_MS = 24 * 60 * 60 * 1000;

export type ValidationSnapshotStatus = "none" | "passed" | "failed" | "stale";

export function saveValidationReport(report: ContactValidationReport): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(report));
    window.dispatchEvent(new CustomEvent("hewane-validation-updated"));
  } catch {
    // ignore quota errors
  }
}

export function loadValidationReport(): ContactValidationReport | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ContactValidationReport;
  } catch {
    return null;
  }
}

export function clearValidationReport(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("hewane-validation-updated"));
}

export function isValidationFresh(
  report: ContactValidationReport,
  maxAgeMs = VALIDATION_FRESH_MS
): boolean {
  const age = Date.now() - new Date(report.validatedAt).getTime();
  return age >= 0 && age <= maxAgeMs;
}

export function getValidationSnapshotStatus(
  report: ContactValidationReport | null,
  maxAgeMs = VALIDATION_FRESH_MS
): ValidationSnapshotStatus {
  if (!report) return "none";
  if (!report.valid) return "failed";
  if (!isValidationFresh(report, maxAgeMs)) return "stale";
  return "passed";
}

"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, ShieldOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ContactValidationReport } from "@/lib/validation";
import {
  getValidationSnapshotStatus,
  type ValidationSnapshotStatus,
} from "@/lib/validation-storage";

const LABELS: Record<ValidationSnapshotStatus, string> = {
  none: "Not validated",
  passed: "Validation passed",
  failed: "Validation failed",
  stale: "Validation outdated",
};

const VARIANTS: Record<
  ValidationSnapshotStatus,
  "success" | "danger" | "warning" | "muted"
> = {
  none: "muted",
  passed: "success",
  failed: "danger",
  stale: "warning",
};

export function ValidationStatusChip({
  report,
  linkToContacts = true,
  className,
}: {
  report: ContactValidationReport | null;
  linkToContacts?: boolean;
  className?: string;
}) {
  const status = getValidationSnapshotStatus(report);
  const Icon =
    status === "passed"
      ? CheckCircle2
      : status === "failed"
        ? AlertTriangle
        : status === "stale"
          ? Clock
          : ShieldOff;

  const content = (
    <Badge variant={VARIANTS[status]} className={className}>
      <Icon className="mr-1 size-3" />
      {LABELS[status]}
      {report?.validatedAt ? (
        <span className="ml-1 hidden opacity-80 sm:inline">
          · {new Date(report.validatedAt).toLocaleDateString()}
        </span>
      ) : null}
    </Badge>
  );

  if (linkToContacts) {
    return (
      <Link href="/contacts" className="inline-flex hover:opacity-90" title="Open contacts to validate">
        {content}
      </Link>
    );
  }

  return content;
}

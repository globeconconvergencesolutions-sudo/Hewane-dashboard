"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ContactValidationReport } from "@/lib/validation";
import {
  getValidationSnapshotStatus,
  type ValidationSnapshotStatus,
} from "@/lib/validation-storage";
import { cn } from "@/lib/utils";

function bannerStyles(status: ValidationSnapshotStatus) {
  if (status === "passed") {
    return {
      border: "border-emerald-200 dark:border-emerald-900/40",
      bg: "bg-emerald-50/80 dark:bg-emerald-950/20",
      text: "text-emerald-950 dark:text-emerald-100",
      icon: CheckCircle2,
      iconClass: "text-emerald-600",
    };
  }
  if (status === "failed") {
    return {
      border: "border-red-200 dark:border-red-900/40",
      bg: "bg-red-50/80 dark:bg-red-950/20",
      text: "text-red-950 dark:text-red-100",
      icon: AlertTriangle,
      iconClass: "text-red-600",
    };
  }
  if (status === "stale") {
    return {
      border: "border-amber-200 dark:border-amber-900/40",
      bg: "bg-amber-50/80 dark:bg-amber-950/20",
      text: "text-amber-950 dark:text-amber-100",
      icon: Clock,
      iconClass: "text-amber-600",
    };
  }
  return {
    border: "border-amber-200 dark:border-amber-900/40",
    bg: "bg-amber-50/80 dark:bg-amber-950/20",
    text: "text-amber-950 dark:text-amber-100",
    icon: ShieldCheck,
    iconClass: "text-amber-600",
  };
}

function bannerMessage(status: ValidationSnapshotStatus, report: ContactValidationReport | null) {
  if (status === "passed" && report) {
    return {
      title: "Contacts validated",
      body: `${report.summary.validContacts} valid across ${report.summary.sourcesChecked} source(s). Last checked ${new Date(report.validatedAt).toLocaleString()}.`,
    };
  }
  if (status === "failed" && report) {
    return {
      title: "Fix validation issues before broadcasting",
      body: `${report.summary.invalidContacts} invalid and ${report.summary.duplicates} duplicate contact(s). ${report.overallHealth}`,
    };
  }
  if (status === "stale" && report) {
    return {
      title: "Validation is outdated",
      body: `Last validation was ${new Date(report.validatedAt).toLocaleString()}. Re-validate after sheet edits.`,
    };
  }
  return {
    title: "Validate contacts before your first send",
    body: "Run Validate on the Contacts page to check phone numbers and duplicates across all sheets.",
  };
}

export function ValidationGateBanner({
  report,
  acknowledgeBypass,
  onAcknowledgeBypass,
}: {
  report: ContactValidationReport | null;
  acknowledgeBypass?: boolean;
  onAcknowledgeBypass?: (value: boolean) => void;
}) {
  const status = getValidationSnapshotStatus(report);
  const styles = bannerStyles(status);
  const Icon = styles.icon;
  const message = bannerMessage(status, report);

  const blocksBroadcast = status === "failed";
  const needsAcknowledgement = status === "none" || status === "stale";

  return (
    <Card className={cn("shadow-sm", styles.border, styles.bg)}>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <Icon className={cn("mt-0.5 size-5 shrink-0", styles.iconClass)} />
          <div className={cn("space-y-1 text-sm", styles.text)}>
            <p className="font-semibold">{message.title}</p>
            <p className="opacity-90">{message.body}</p>
            {blocksBroadcast ? (
              <p className="font-medium">Broadcast is blocked until validation passes.</p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {(needsAcknowledgement || blocksBroadcast) && (
            <Button asChild variant="outline" size="sm" className="bg-background/80">
              <Link href="/contacts">
                <ShieldCheck className="mr-1.5 size-3.5" />
                {status === "failed" ? "Review issues" : "Validate now"}
              </Link>
            </Button>
          )}
          {needsAcknowledgement && onAcknowledgeBypass ? (
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-xs">
              <input
                type="checkbox"
                checked={acknowledgeBypass}
                onChange={(e) => onAcknowledgeBypass(e.target.checked)}
              />
              Proceed without validation
            </label>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function broadcastBlockedByValidation(
  report: ContactValidationReport | null,
  acknowledgeBypass: boolean
): boolean {
  const status = getValidationSnapshotStatus(report);
  if (status === "failed") return true;
  if ((status === "none" || status === "stale") && !acknowledgeBypass) return true;
  return false;
}

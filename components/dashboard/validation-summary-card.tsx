"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ContactValidationReport } from "@/lib/validation";
import { ValidationStatusChip } from "@/components/dashboard/validation-status-chip";
import { healthTone } from "@/lib/validation";
import { cn } from "@/lib/utils";

export function ValidationSummaryCard({
  report,
}: {
  report: ContactValidationReport | null;
}) {
  if (!report) {
    return (
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-primary" />
            Contact validation
          </CardTitle>
          <CardDescription>No validation run in this browser session yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="sm" variant="outline">
            <Link href="/contacts">
              Run validate
              <ArrowRight className="ml-1.5 size-3.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const tone = healthTone(report.overallHealth, report.valid);

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-primary" />
            Contact validation
          </CardTitle>
          <ValidationStatusChip report={report} linkToContacts={false} />
        </div>
        <CardDescription>{new Date(report.validatedAt).toLocaleString()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p
          className={cn(
            "text-sm font-medium",
            tone === "success" && "text-emerald-700",
            tone === "warning" && "text-amber-700",
            tone === "danger" && "text-red-700"
          )}
        >
          {report.overallHealth}
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <p className="text-xs text-muted-foreground">Valid</p>
            <p className="font-semibold tabular-nums">{report.summary.validContacts}</p>
          </div>
          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <p className="text-xs text-muted-foreground">Issues</p>
            <p className="font-semibold tabular-nums text-red-600">
              {report.summary.invalidContacts + report.summary.duplicates}
            </p>
          </div>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/contacts">
            {report.valid ? "View report" : "Fix & re-validate"}
            <ArrowRight className="ml-1.5 size-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

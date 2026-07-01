"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExportActions } from "@/components/dashboard/export-actions";
import { useExportDownload } from "@/hooks/use-export-download";
import type { ExportFormat } from "@/lib/export-formats";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ContactValidationReport } from "@/lib/validation";
import { healthTone } from "@/lib/validation";

function sheetUrl(spreadsheetId: string) {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
}

function toneClasses(tone: "success" | "warning" | "danger") {
  if (tone === "success") {
    return {
      border: "border-emerald-200 dark:border-emerald-900/40",
      bg: "bg-emerald-50/80 dark:bg-emerald-950/20",
      text: "text-emerald-950 dark:text-emerald-100",
      badge: "success" as const,
    };
  }
  if (tone === "warning") {
    return {
      border: "border-amber-200 dark:border-amber-900/40",
      bg: "bg-amber-50/80 dark:bg-amber-950/20",
      text: "text-amber-950 dark:text-amber-100",
      badge: "warning" as const,
    };
  }
  return {
    border: "border-red-200 dark:border-red-900/40",
    bg: "bg-red-50/80 dark:bg-red-950/20",
    text: "text-red-950 dark:text-red-100",
    badge: "danger" as const,
  };
}

function SourceSection({
  source,
}: {
  source: ContactValidationReport["sources"][number];
}) {
  const [open, setOpen] = useState(source.invalidCount > 0 || source.dupeCount > 0);
  const hasIssues = source.invalidCount > 0 || source.dupeCount > 0;

  return (
    <div className="rounded-xl border border-border/80 bg-background/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 p-4 text-left"
      >
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">{source.label}</span>
            {source.schema ? (
              <Badge variant="muted" className="text-[10px] uppercase tracking-wide">
                {source.schema}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {source.tab}
            {source.spreadsheetId ? (
              <>
                {" · "}
                <a
                  href={sheetUrl(source.spreadsheetId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Open sheet
                  <ExternalLink className="size-3" />
                </a>
              </>
            ) : null}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="muted">{source.totalRows} rows</Badge>
            <Badge variant="success">{source.validCount} valid</Badge>
            {source.invalidCount > 0 ? (
              <Badge variant="danger">{source.invalidCount} invalid</Badge>
            ) : null}
            {source.dupeCount > 0 ? (
              <Badge variant="warning">{source.dupeCount} duplicates</Badge>
            ) : null}
          </div>
        </div>
        {open ? (
          <ChevronDown className="mt-1 size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {open && hasIssues ? (
        <div className="space-y-4 border-t border-border/60 px-4 pb-4">
          {source.invalid.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Invalid rows</p>
              <div className="overflow-x-auto rounded-lg border border-border/80">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Row</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Issue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {source.invalid.map((row, idx) => (
                      <TableRow key={`${source.label}-invalid-${row.row}-${idx}`}>
                        <TableCell className="font-mono text-xs">{row.row}</TableCell>
                        <TableCell>{row.name || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{row.rawPhone || "—"}</TableCell>
                        <TableCell className="text-sm text-destructive">{row.issue}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}

          {source.dupes.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Possible duplicates</p>
              <div className="overflow-x-auto rounded-lg border border-border/80">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Row</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Issue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {source.dupes.map((row, idx) => (
                      <TableRow key={`${source.label}-dupe-${idx}`}>
                        <TableCell className="font-mono text-xs">{row.row ?? "—"}</TableCell>
                        <TableCell>{row.name ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{row.rawPhone ?? "—"}</TableCell>
                        <TableCell className="text-sm text-amber-700 dark:text-amber-300">
                          {row.issue ?? "Duplicate phone"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {open && !hasIssues ? (
        <div className="border-t border-border/60 px-4 pb-4 pt-3 text-sm text-muted-foreground">
          No issues found in this source.
        </div>
      ) : null}
    </div>
  );
}

export function ValidationReportPanel({
  report,
  onDismiss,
}: {
  report: ContactValidationReport;
  onDismiss: () => void;
}) {
  const tone = healthTone(report.overallHealth, report.valid);
  const styles = toneClasses(tone);
  const { downloadExport, exporting } = useExportDownload();

  const copySummary = async () => {
    const lines = [
      report.overallHealth,
      `Validated: ${new Date(report.validatedAt).toLocaleString()}`,
      `Total: ${report.summary.totalContacts} · Valid: ${report.summary.validContacts} · Invalid: ${report.summary.invalidContacts} · Dupes: ${report.summary.duplicates}`,
      "",
      ...report.sources.flatMap((source) => [
        `${source.label} (${source.tab})`,
        ...source.invalid.map(
          (row) => `  Row ${row.row}: ${row.issue} — ${row.name} (${row.rawPhone})`
        ),
      ]),
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
  };

  const handleExport = (format: ExportFormat) => {
    downloadExport(format, {
      url: `/api/validation/export?format=${format}`,
      method: "POST",
      body: report,
      filenameBase: "hewane-validation-report",
    });
  };

  return (
    <Card className={cn("shadow-sm", styles.border, styles.bg)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {report.valid ? (
              <CheckCircle2 className="size-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="size-5 text-red-600" />
            )}
            <CardTitle className={cn("text-lg", styles.text)}>Validation report</CardTitle>
          </div>
          <p className={cn("text-sm font-medium", styles.text)}>{report.overallHealth}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(report.validatedAt).toLocaleString()} · {report.summary.sourcesChecked}{" "}
            source(s) checked
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
          <ExportActions onExport={handleExport} exporting={exporting} />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={copySummary}>
              <Copy className="mr-1.5 size-3.5" />
              Copy
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={onDismiss} title="Dismiss">
              <X className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Total contacts", value: report.summary.totalContacts },
            { label: "Valid", value: report.summary.validContacts },
            { label: "Invalid", value: report.summary.invalidContacts },
            { label: "Duplicates", value: report.summary.duplicates },
            { label: "Sources", value: report.summary.sourcesChecked },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border/60 bg-background/70 px-4 py-3"
            >
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">By source</p>
          {report.sources.map((source) => (
            <SourceSection key={`${source.label}-${source.spreadsheetId}-${source.tab}`} source={source} />
          ))}
        </div>

        {!report.valid ? (
          <p className="text-sm text-muted-foreground">
            Fix the rows above in Google Sheets, then run Validate again before broadcasting.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

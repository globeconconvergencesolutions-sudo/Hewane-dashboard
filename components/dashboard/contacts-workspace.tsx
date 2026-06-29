"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Upload,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/dashboard/page-hero";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Contact, PaginatedContactsResponse } from "@/lib/types";
import type { ContactSortField } from "@/lib/contacts-query";
import type { ContactValidationReport } from "@/lib/validation";
import { clearValidationReport, saveValidationReport } from "@/lib/validation-storage";
import { ValidationReportPanel } from "@/components/dashboard/validation-report-panel";
import { useIntegrationsStatus } from "@/hooks/use-integrations-status";
import { useValidationReport } from "@/hooks/use-validation-report";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

type QueryState = {
  page: number;
  pageSize: number;
  q: string;
  segment: string;
  source: string;
  status: string;
  whatsapp: string;
  sort: ContactSortField;
  order: "asc" | "desc";
};

const DEFAULT_QUERY: QueryState = {
  page: 1,
  pageSize: 25,
  q: "",
  segment: "all",
  source: "all",
  status: "all",
  whatsapp: "all",
  sort: "name",
  order: "asc",
};

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length >= 12) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  return phone.startsWith("+") ? phone : `+${phone}`;
}

function displayStatus(status: Contact["status"]) {
  return status || "Pending";
}

function statusVariant(status: Contact["status"]) {
  if (status === "Sent") return "success" as const;
  if (status === "Failed") return "danger" as const;
  return "muted" as const;
}

function buildSearchParams(query: QueryState, refresh = false) {
  const params = new URLSearchParams();
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));
  params.set("sort", query.sort);
  params.set("order", query.order);
  if (query.q.trim()) params.set("q", query.q.trim());
  if (query.segment !== "all") params.set("segment", query.segment);
  if (query.source !== "all") params.set("source", query.source);
  if (query.status !== "all") params.set("status", query.status);
  if (query.whatsapp !== "all") params.set("whatsapp", query.whatsapp);
  if (refresh) params.set("refresh", "true");
  return params;
}

function SortButton({
  label,
  field,
  activeField,
  order,
  onSort,
}: {
  label: string;
  field: ContactSortField;
  activeField: ContactSortField;
  order: "asc" | "desc";
  onSort: (field: ContactSortField) => void;
}) {
  const active = activeField === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1.5 text-left font-medium text-foreground hover:text-primary"
    >
      {label}
      {active ? (
        order === "asc" ? (
          <ArrowUp className="size-3.5" />
        ) : (
          <ArrowDown className="size-3.5" />
        )
      ) : (
        <ArrowUpDown className="size-3.5 opacity-40" />
      )}
    </button>
  );
}

function ContactsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-36 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-[420px] rounded-xl" />
    </div>
  );
}

function ContactCard({ contact }: { contact: Contact }) {
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{contact.name}</p>
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              {formatPhone(contact.phone)}
            </p>
          </div>
          <Badge variant={statusVariant(contact.status)}>{displayStatus(contact.status)}</Badge>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline">{contact.segment || "General"}</Badge>
          {contact.sourceLabel ? (
            <Badge variant="secondary">{contact.sourceLabel}</Badge>
          ) : null}
          {contact.sendWhatsapp === "Yes" ? (
            <Badge variant="success">WhatsApp</Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function ContactsWorkspace() {
  const { toast } = useToast();
  const [query, setQuery] = useState<QueryState>(DEFAULT_QUERY);
  const [data, setData] = useState<PaginatedContactsResponse | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [validateLoading, setValidateLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const validationReport = useValidationReport();

  const debouncedQ = useDebounce(query.q, 300);
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const { integrations } = useIntegrationsStatus();

  const syncDisabledReason = integrations?.n8n.syncDisabledReason ?? null;
  const validateDisabledReason = integrations?.n8n.validateDisabledReason ?? null;

  const fetchContacts = useCallback(
    async (nextQuery: QueryState, refresh = false, signal?: AbortSignal) => {
      const params = buildSearchParams(nextQuery, refresh);
      const res = await fetch(`/api/contacts?${params.toString()}`, { signal });
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return (await res.json()) as PaginatedContactsResponse;
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      setIsFetching(true);
      try {
        const result = await fetchContacts({ ...query, q: debouncedQ }, false, controller.signal);
        if (cancelled) return;

        setData(result);

        if (result.pagination.page !== query.page) {
          setQuery((current) =>
            current.page === result.pagination.page
              ? current
              : { ...current, page: result.pagination.page }
          );
        }
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) return;
        toastRef.current({
          title: "Could not load contacts",
          description: "Check your Google Sheets connection and try again.",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) {
          setIsFetching(false);
          setInitialLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    debouncedQ,
    query.page,
    query.pageSize,
    query.segment,
    query.source,
    query.status,
    query.whatsapp,
    query.sort,
    query.order,
    fetchContacts,
  ]);

  const updateQuery = (patch: Partial<QueryState>) => {
    setQuery((current) => {
      const filterChanged =
        patch.q !== undefined ||
        patch.segment !== undefined ||
        patch.source !== undefined ||
        patch.status !== undefined ||
        patch.whatsapp !== undefined;

      return {
        ...current,
        ...patch,
        page: patch.page ?? (filterChanged ? 1 : current.page),
      };
    });
  };

  const handleSort = (field: ContactSortField) => {
    setQuery((current) => ({
      ...current,
      sort: field,
      order: current.sort === field && current.order === "asc" ? "desc" : "asc",
      page: 1,
    }));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await fetchContacts(query, true);
      setData(result);
      toast({ title: "Contacts refreshed", description: `${result.facets.segments.reduce((n, s) => n + s.count, 0)} total loaded.` });
    } catch {
      toast({ title: "Refresh failed", variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSync = async () => {
    if (syncDisabledReason) {
      toast({ title: "Sync unavailable", description: syncDisabledReason, variant: "destructive" });
      return;
    }
    setSyncLoading(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((body.error as string) || "Sync failed");
      const result = await fetchContacts({ ...query, q: debouncedQ }, true);
      setData(result);
      toast({ title: "Sync complete", description: "n8n sync workflow finished. Contacts refreshed." });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Could not run sync workflow.",
        variant: "destructive",
      });
    } finally {
      setSyncLoading(false);
    }
  };

  const handleValidate = async () => {
    if (validateDisabledReason) {
      toast({
        title: "Validate unavailable",
        description: validateDisabledReason,
        variant: "destructive",
      });
      return;
    }
    setValidateLoading(true);
    try {
      const res = await fetch("/api/contacts/validate", { method: "POST" });
      const body = (await res.json()) as ContactValidationReport & { error?: string };
      if (!res.ok) throw new Error(body.error || "Validation failed");

      saveValidationReport(body);

      if (body.valid) {
        toast({
          title: "Validation passed",
          description: body.overallHealth || "All contacts look good.",
        });
      } else {
        toast({
          title: "Validation issues found",
          description: `${body.summary.invalidContacts} invalid · ${body.summary.duplicates} duplicate(s). See report below.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Validation failed",
        description: error instanceof Error ? error.message : "Could not run validation workflow.",
        variant: "destructive",
      });
    } finally {
      setValidateLoading(false);
    }
  };

  const activeFilters = useMemo(() => {
    const chips: { key: keyof QueryState; label: string }[] = [];
    if (query.segment !== "all") chips.push({ key: "segment", label: `Segment: ${query.segment}` });
    if (query.source !== "all") {
      const sourceLabel = data?.facets.sources.find((s) => s.value === query.source)?.label || query.source;
      chips.push({ key: "source", label: `Source: ${sourceLabel}` });
    }
    if (query.status !== "all") chips.push({ key: "status", label: `Status: ${query.status}` });
    if (query.whatsapp !== "all") chips.push({ key: "whatsapp", label: `WhatsApp: ${query.whatsapp}` });
    if (debouncedQ.trim()) chips.push({ key: "q", label: `Search: "${debouncedQ.trim()}"` });
    return chips;
  }, [query, debouncedQ, data?.facets.sources]);

  const totalAll = useMemo(() => {
    if (!data) return 0;
    return data.facets.segments.reduce((sum, item) => sum + item.count, 0);
  }, [data]);

  const clearFilters = () => {
    setQuery((current) => ({
      ...current,
      page: 1,
      q: "",
      segment: "all",
      source: "all",
      status: "all",
      whatsapp: "all",
    }));
  };

  if (initialLoading && !data) {
    return <ContactsSkeleton />;
  }

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const facets = data?.facets;

  return (
    <div className="space-y-6">
      <PageHero
        title="Contact Directory"
        description="Search, filter, and manage contacts across all connected Google Sheets without loading thousands of rows at once."
        actions={
          <>
            <Button
              variant="outline"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              onClick={handleRefresh}
              disabled={refreshing || isFetching}
            >
              <RefreshCw className={cn("mr-2 size-4", refreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button
              variant="outline"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              onClick={handleValidate}
              disabled={validateLoading || Boolean(validateDisabledReason)}
              title={validateDisabledReason ?? undefined}
            >
              <ShieldCheck className="mr-2 size-4" />
              {validateLoading ? "Validating..." : "Validate"}
            </Button>
            <Button
              className="bg-[#E8B825] text-[#1a1a2e] hover:bg-[#f0c84a] disabled:opacity-60"
              onClick={handleSync}
              disabled={syncLoading || Boolean(syncDisabledReason)}
              title={syncDisabledReason ?? undefined}
            >
              <Upload className="mr-2 size-4" />
              {syncLoading ? "Syncing..." : "Sync Sheets"}
            </Button>
          </>
        }
      />

      {(validateDisabledReason || syncDisabledReason) ? (
        <Card className="border-amber-200 bg-amber-50/80 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
          <CardContent className="space-y-2 p-4 text-sm text-amber-950 dark:text-amber-100">
            {validateDisabledReason ? (
              <p>
                <strong>Validate</strong> needs <code className="text-xs">N8N_VALIDATE_WEBHOOK_URL</code>{" "}
                (hewane-validate). {validateDisabledReason}
              </p>
            ) : null}
            {syncDisabledReason ? (
              <p>
                <strong>Sync Sheets</strong> needs <code className="text-xs">N8N_WORKFLOW_A_URL</code>{" "}
                (hewane-sheets-sync). {syncDisabledReason}
              </p>
            ) : null}
            <p className="text-amber-900/80 dark:text-amber-200/80">
              Refresh still loads contacts directly from Google Sheets.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {validationReport ? (
        <ValidationReportPanel
          report={validationReport}
          onDismiss={() => clearValidationReport()}
        />
      ) : null}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/80 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Matching contacts</p>
              <p className="text-2xl font-bold">{pagination?.total ?? 0}</p>
              <p className="text-xs text-muted-foreground">of {totalAll} total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-secondary/20 p-3 text-secondary-foreground">
              <Filter className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sources</p>
              <p className="text-2xl font-bold">{facets?.sources.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">connected spreadsheets</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
              <Phone className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">WhatsApp enabled</p>
              <p className="text-2xl font-bold">{facets?.whatsapp.yes ?? 0}</p>
              <p className="text-xs text-muted-foreground">{facets?.whatsapp.no ?? 0} excluded</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-muted p-3 text-muted-foreground">
              <RefreshCw className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data cache</p>
              <p className="text-2xl font-bold">{data?.meta.fromCache ? "Cached" : "Fresh"}</p>
              <p className="text-xs text-muted-foreground">
                {data?.meta.queryMs != null ? `${data.meta.queryMs}ms` : "Ready"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <Card className="border-border/80 shadow-sm">
        <CardContent className="space-y-4 p-4 md:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query.q}
                onChange={(e) => updateQuery({ q: e.target.value, page: 1 })}
                placeholder="Search name, phone, email, segment, or source..."
                className="h-10 pl-10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters((value) => !value)}
              >
                <Filter className="mr-2 size-4" />
                Filters
              </Button>
              <Select
                value={String(query.pageSize)}
                onChange={(e) => updateQuery({ pageSize: Number(e.target.value), page: 1 })}
                className="w-[110px]"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {showFilters ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Select
                value={query.segment}
                onChange={(e) => updateQuery({ segment: e.target.value, page: 1 })}
              >
                <option value="all">All segments</option>
                {facets?.segments.map((segment) => (
                  <option key={segment.value} value={segment.value}>
                    {segment.value} ({segment.count})
                  </option>
                ))}
              </Select>
              <Select
                value={query.source}
                onChange={(e) => updateQuery({ source: e.target.value, page: 1 })}
              >
                <option value="all">All sources</option>
                {facets?.sources.map((source) => (
                  <option key={source.value} value={source.value}>
                    {source.label} ({source.count})
                  </option>
                ))}
              </Select>
              <Select
                value={query.status}
                onChange={(e) => updateQuery({ status: e.target.value, page: 1 })}
              >
                <option value="all">All statuses</option>
                {facets?.statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.value} ({status.count})
                  </option>
                ))}
              </Select>
              <Select
                value={query.whatsapp}
                onChange={(e) => updateQuery({ whatsapp: e.target.value, page: 1 })}
              >
                <option value="all">All WhatsApp settings</option>
                <option value="Yes">WhatsApp enabled ({facets?.whatsapp.yes ?? 0})</option>
                <option value="No">WhatsApp disabled ({facets?.whatsapp.no ?? 0})</option>
              </Select>
            </div>
          ) : null}

          {activeFilters.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {activeFilters.map((chip) => (
                <Badge key={chip.key} variant="outline" className="gap-1 pr-1">
                  {chip.label}
                  <button
                    type="button"
                    className="rounded-full p-0.5 hover:bg-muted"
                    onClick={() =>
                      updateQuery({
                        [chip.key]: chip.key === "q" ? "" : "all",
                        page: 1,
                      } as Partial<QueryState>)
                    }
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Results */}
      <Card className={cn("overflow-hidden border-border/80 shadow-sm transition-opacity", isFetching && "opacity-70")}>
        <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3 md:px-5">
          <div>
            <p className="font-semibold text-foreground">
              Page {pagination?.page ?? 1} of {pagination?.totalPages ?? 1}
            </p>
            <p className="text-sm text-muted-foreground">
              Showing {items.length} contact{items.length === 1 ? "" : "s"}
              {isFetching ? " · updating..." : ""}
            </p>
          </div>
          {isFetching ? (
            <RefreshCw className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
          ) : null}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead>
                  <SortButton label="Name" field="name" activeField={query.sort} order={query.order} onSort={handleSort} />
                </TableHead>
                <TableHead>
                  <SortButton label="Phone" field="phone" activeField={query.sort} order={query.order} onSort={handleSort} />
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead>
                  <SortButton label="Segment" field="segment" activeField={query.sort} order={query.order} onSort={handleSort} />
                </TableHead>
                <TableHead>
                  <SortButton label="Source" field="sourceLabel" activeField={query.sort} order={query.order} onSort={handleSort} />
                </TableHead>
                <TableHead>
                  <SortButton label="Status" field="status" activeField={query.sort} order={query.order} onSort={handleSort} />
                </TableHead>
                <TableHead>WhatsApp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length ? (
                items.map((contact) => (
                  <TableRow key={contact.id} className="hover:bg-primary/[0.03]">
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell className="font-mono text-sm">{formatPhone(contact.phone)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{contact.email || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{contact.segment || "General"}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {contact.sourceLabel || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(contact.status)}>
                        {displayStatus(contact.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {contact.sendWhatsapp === "Yes" ? (
                        <Badge variant="success">Yes</Badge>
                      ) : (
                        <Badge variant="muted">No</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : isFetching ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No contacts match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile cards */}
        <div className="grid gap-3 p-4 md:hidden">
          {items.length ? (
            items.map((contact) => <ContactCard key={contact.id} contact={contact} />)
          ) : isFetching ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              No contacts match your filters.
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination ? (
          <div className="flex flex-col gap-3 border-t bg-muted/20 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
            <p className="text-sm text-muted-foreground">
              {pagination.total === 0
                ? "No results"
                : `${(pagination.page - 1) * pagination.pageSize + 1}-${Math.min(
                    pagination.page * pagination.pageSize,
                    pagination.total
                  )} of ${pagination.total}`}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPreviousPage || isFetching}
                onClick={() => updateQuery({ page: 1 })}
              >
                <ChevronsLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPreviousPage || isFetching}
                onClick={() => updateQuery({ page: pagination.page - 1 })}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="min-w-[88px] text-center text-sm font-medium">
                Page {pagination.page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage || isFetching}
                onClick={() => updateQuery({ page: pagination.page + 1 })}
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage || isFetching}
                onClick={() => updateQuery({ page: pagination.totalPages })}
              >
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

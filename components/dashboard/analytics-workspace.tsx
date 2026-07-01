"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { format, isValid } from "date-fns";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  RefreshCw,
  Search,
  Send,
  CheckCircle2,
  XCircle,
  TrendingUp,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHero } from "@/components/dashboard/page-hero";
import { StatCard } from "@/components/dashboard/stat-card";
import { ExportActions } from "@/components/dashboard/export-actions";
import { useDebounce } from "@/hooks/use-debounce";
import { useExportDownload } from "@/hooks/use-export-download";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Campaign, PaginatedAnalyticsResponse } from "@/lib/types";
import type { CampaignSortField } from "@/lib/analytics-query";
import type { ExportFormat } from "@/lib/export-formats";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

type QueryState = {
  page: number;
  pageSize: number;
  q: string;
  messageType: string;
  contactGroup: string;
  sort: CampaignSortField;
  order: "asc" | "desc";
};

const DEFAULT_QUERY: QueryState = {
  page: 1,
  pageSize: 25,
  q: "",
  messageType: "all",
  contactGroup: "all",
  sort: "date",
  order: "desc",
};

function formatCampaignDate(value: Campaign["date"]) {
  const date = value instanceof Date ? value : new Date(value);
  if (!isValid(date) || date.getTime() === 0) return "—";
  return format(date, "dd MMM yyyy");
}

function buildSearchParams(query: QueryState, refresh = false) {
  const params = new URLSearchParams();
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));
  params.set("sort", query.sort);
  params.set("order", query.order);
  if (query.q.trim()) params.set("q", query.q.trim());
  if (query.messageType !== "all") params.set("messageType", query.messageType);
  if (query.contactGroup !== "all") params.set("contactGroup", query.contactGroup);
  if (refresh) params.set("refresh", "true");
  return params;
}

function buildExportSearchParams(query: QueryState, search: string) {
  const params = buildSearchParams({ ...query, q: search });
  params.delete("page");
  params.delete("pageSize");
  return params;
}

function SortButton({
  label,
  field,
  activeField,
  order,
  onSort,
  className,
}: {
  label: string;
  field: CampaignSortField;
  activeField: CampaignSortField;
  order: "asc" | "desc";
  onSort: (field: CampaignSortField) => void;
  className?: string;
}) {
  const active = activeField === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={cn(
        "inline-flex items-center gap-1.5 text-left font-medium text-foreground hover:text-primary",
        className
      )}
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

function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{campaign.campaignName}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatCampaignDate(campaign.date)}
              {campaign.time ? ` · ${campaign.time}` : ""}
            </p>
          </div>
          <Badge variant="outline" className="shrink-0 capitalize">
            {campaign.messageType}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="muted" className="capitalize">
            {campaign.contactGroup || "All"}
          </Badge>
          <Badge variant="success">{campaign.successRate} success</Badge>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-lg bg-muted/40 px-2 py-2">
            <p className="text-xs text-muted-foreground">Sent</p>
            <p className="font-semibold">{campaign.totalSent}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 px-2 py-2">
            <p className="text-xs text-emerald-700">Delivered</p>
            <p className="font-semibold text-emerald-700">{campaign.delivered}</p>
          </div>
          <div className="rounded-lg bg-red-50 px-2 py-2">
            <p className="text-xs text-red-600">Failed</p>
            <p className="font-semibold text-red-600">{campaign.failed}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsWorkspace() {
  const { toast } = useToast();
  const [query, setQuery] = useState<QueryState>(DEFAULT_QUERY);
  const [data, setData] = useState<PaginatedAnalyticsResponse | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const { downloadExport, exporting } = useExportDownload();

  const debouncedQ = useDebounce(query.q, 300);
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const fetchAnalytics = useCallback(
    async (nextQuery: QueryState, refresh = false, signal?: AbortSignal) => {
      const params = buildSearchParams({ ...nextQuery, q: debouncedQ }, refresh);
      setIsFetching(true);

      try {
        const res = await fetch(`/api/analytics?${params.toString()}`, { signal });
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const payload = (await res.json()) as PaginatedAnalyticsResponse;
        setData(payload);
      } catch (error) {
        if (signal?.aborted) return;
        toastRef.current({
          title: "Could not load analytics",
          description: "Ensure your Analytics sheet tab is configured in sheets.config.json.",
          variant: "destructive",
        });
      } finally {
        if (!signal?.aborted) {
          setInitialLoading(false);
          setIsFetching(false);
        }
      }
    },
    [debouncedQ]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchAnalytics(query, false, controller.signal);
    return () => controller.abort();
  }, [query, debouncedQ, fetchAnalytics]);

  const updateQuery = (patch: Partial<QueryState>) => {
    setQuery((current) => ({ ...current, ...patch }));
  };

  const handleSort = (field: CampaignSortField) => {
    setQuery((current) => ({
      ...current,
      page: 1,
      sort: field,
      order: current.sort === field && current.order === "desc" ? "asc" : "desc",
    }));
  };

  const handleRefresh = () => {
    fetchAnalytics(query, true);
  };

  const handleExport = (format: ExportFormat) => {
    const params = buildExportSearchParams(query, debouncedQ);
    params.set("format", format);
    downloadExport(format, {
      url: `/api/analytics/export?${params.toString()}`,
      filenameBase: "hewane-campaigns",
    });
  };

  const clearFilters = () => {
    setQuery((current) => ({
      ...current,
      page: 1,
      q: "",
      messageType: "all",
      contactGroup: "all",
    }));
  };

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const facets = data?.facets;
  const summary = data?.summary;
  const filteredSummary = data?.filteredSummary;
  const hasFilters =
    query.q.trim() !== "" || query.messageType !== "all" || query.contactGroup !== "all";
  const displaySummary = hasFilters ? filteredSummary : summary;

  const activeFilters = useMemo(() => {
    const chips: { key: keyof QueryState; label: string }[] = [];
    if (query.q.trim()) chips.push({ key: "q", label: `Search: ${query.q.trim()}` });
    if (query.messageType !== "all")
      chips.push({ key: "messageType", label: `Type: ${query.messageType}` });
    if (query.contactGroup !== "all")
      chips.push({ key: "contactGroup", label: `Group: ${query.contactGroup}` });
    return chips;
  }, [query]);

  if (initialLoading) {
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

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Performance insights"
        title="Analytics"
        description="Review campaign delivery, filter history, and export reports for your records."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              onClick={handleRefresh}
              disabled={isFetching}
            >
              <RefreshCw className={cn("mr-2 size-4", isFetching && "animate-spin")} />
              Refresh
            </Button>
            <ExportActions
              variant="hero"
              onExport={handleExport}
              exporting={exporting}
              disabled={isFetching}
            />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={hasFilters ? "Filtered sent" : "Total sent"}
          value={displaySummary?.totalSent ?? 0}
          icon={<Send className="size-5 text-primary" />}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatCard
          label="Delivered"
          value={displaySummary?.totalDelivered ?? 0}
          icon={<CheckCircle2 className="size-5 text-emerald-700" />}
          iconClassName="bg-emerald-100 text-emerald-700"
          valueClassName="text-emerald-700"
        />
        <StatCard
          label="Failed"
          value={displaySummary?.totalFailed ?? 0}
          icon={<XCircle className="size-5 text-red-600" />}
          iconClassName="bg-red-100 text-red-600"
          valueClassName="text-red-600"
        />
        <StatCard
          label={hasFilters ? "Filtered success" : "Avg success"}
          value={displaySummary?.avgSuccess ?? "0%"}
          icon={<TrendingUp className="size-5 text-[#7D3F7E]" />}
          iconClassName="bg-[#7D3F7E]/10 text-[#7D3F7E]"
          valueClassName="text-[#7D3F7E]"
        />
      </div>

      {summary && summary.campaignCount > 0 ? (
        <Card className="border-border/80 shadow-sm">
          <CardContent className="flex flex-wrap items-center gap-3 p-4 text-sm text-muted-foreground">
            <BarChart3 className="size-4 text-primary" />
            <span>
              <strong className="text-foreground">{summary.campaignCount}</strong> campaigns logged
              {hasFilters && pagination ? (
                <>
                  {" "}
                  · showing{" "}
                  <strong className="text-foreground">{pagination.total}</strong> matching filters
                </>
              ) : null}
            </span>
            {data?.meta.fromCache ? (
              <Badge variant="outline" className="ml-auto">
                Cached · refresh for latest sheet data
              </Badge>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/80 shadow-sm">
        <CardContent className="space-y-4 p-4 md:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query.q}
                onChange={(e) => updateQuery({ q: e.target.value, page: 1 })}
                placeholder="Search campaign name, group, or type..."
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
            <div className="grid gap-3 md:grid-cols-2">
              <Select
                value={query.messageType}
                onChange={(e) => updateQuery({ messageType: e.target.value, page: 1 })}
              >
                <option value="all">All message types</option>
                {facets?.messageTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.value} ({type.count})
                  </option>
                ))}
              </Select>
              <Select
                value={query.contactGroup}
                onChange={(e) => updateQuery({ contactGroup: e.target.value, page: 1 })}
              >
                <option value="all">All contact groups</option>
                {facets?.contactGroups.map((group) => (
                  <option key={group.value} value={group.value}>
                    {group.value} ({group.count})
                  </option>
                ))}
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

      <Card
        className={cn(
          "overflow-hidden border-border/80 shadow-sm transition-opacity",
          isFetching && "opacity-70"
        )}
      >
        <CardHeader className="flex flex-col gap-4 border-b bg-muted/20 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Campaign history</CardTitle>
            <CardDescription>
              Paginated broadcast results from your Analytics sheet. Exports respect your current
              filters.
            </CardDescription>
          </div>
          <ExportActions onExport={handleExport} exporting={exporting} disabled={isFetching} />
        </CardHeader>

        <div className="flex items-center justify-between border-b bg-muted/10 px-4 py-3 md:px-5">
          <div>
            <p className="font-semibold text-foreground">
              Page {pagination?.page ?? 1} of {pagination?.totalPages ?? 1}
            </p>
            <p className="text-sm text-muted-foreground">
              {pagination?.total === 0
                ? "No campaigns match your filters"
                : `${(pagination!.page - 1) * pagination!.pageSize + 1}-${Math.min(
                    pagination!.page * pagination!.pageSize,
                    pagination!.total
                  )} of ${pagination!.total} campaigns`}
              {isFetching ? " · updating..." : ""}
            </p>
          </div>
          {isFetching ? (
            <RefreshCw className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
          ) : null}
        </div>

        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead>
                  <SortButton
                    label="Campaign"
                    field="campaignName"
                    activeField={query.sort}
                    order={query.order}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Date"
                    field="date"
                    activeField={query.sort}
                    order={query.order}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">
                  <SortButton
                    label="Sent"
                    field="totalSent"
                    activeField={query.sort}
                    order={query.order}
                    onSort={handleSort}
                    className="ml-auto"
                  />
                </TableHead>
                <TableHead className="text-right">
                  <SortButton
                    label="Delivered"
                    field="delivered"
                    activeField={query.sort}
                    order={query.order}
                    onSort={handleSort}
                    className="ml-auto"
                  />
                </TableHead>
                <TableHead className="text-right">
                  <SortButton
                    label="Failed"
                    field="failed"
                    activeField={query.sort}
                    order={query.order}
                    onSort={handleSort}
                    className="ml-auto"
                  />
                </TableHead>
                <TableHead className="text-right">
                  <SortButton
                    label="Success"
                    field="successRate"
                    activeField={query.sort}
                    order={query.order}
                    onSort={handleSort}
                    className="ml-auto"
                  />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length > 0 ? (
                items.map((campaign) => (
                  <TableRow key={campaign.id} className="hover:bg-primary/[0.03]">
                    <TableCell className="max-w-[220px] truncate font-medium">
                      {campaign.campaignName}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span>{formatCampaignDate(campaign.date)}</span>
                      {campaign.time ? (
                        <span className="block text-xs">{campaign.time}</span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant="muted" className="capitalize">
                        {campaign.contactGroup || "All"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {campaign.messageType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{campaign.totalSent}</TableCell>
                    <TableCell className="text-right font-medium text-emerald-600">
                      {campaign.delivered}
                    </TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      {campaign.failed}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-[#7D3F7E]">
                      {campaign.successRate}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="py-16 text-center">
                    <p className="font-medium text-foreground">
                      {hasFilters ? "No campaigns match your filters" : "No campaigns yet"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {hasFilters ? (
                        "Try clearing filters or broadening your search."
                      ) : (
                        <>
                          Launch your first broadcast from the{" "}
                          <Link href="/broadcast" className="font-medium text-primary hover:underline">
                            Broadcast
                          </Link>{" "}
                          page to see data here.
                        </>
                      )}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-3 p-4 md:hidden">
          {items.length > 0 ? (
            items.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              {hasFilters ? "No campaigns match your filters." : "No campaigns logged yet."}
            </div>
          )}
        </div>

        {pagination && pagination.total > 0 ? (
          <div className="flex flex-col gap-3 border-t bg-muted/20 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
            <p className="text-sm text-muted-foreground">
              {(pagination.page - 1) * pagination.pageSize + 1}-
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{" "}
              {pagination.total}
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

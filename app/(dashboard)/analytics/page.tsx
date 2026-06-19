"use client";

import { useCallback, useEffect, useState } from "react";
import { Campaign } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/dashboard/page-hero";
import { StatCard } from "@/components/dashboard/stat-card";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Send, CheckCircle2, XCircle, TrendingUp } from "lucide-react";

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [totalStats, setTotalStats] = useState({
    totalSent: 0,
    totalDelivered: 0,
    totalFailed: 0,
    avgSuccess: "0%",
  });

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/analytics");
      if (!res.ok) throw new Error("Failed to fetch");
      const data: Campaign[] = await res.json();
      setCampaigns(data);

      const totalSent = data.reduce((sum, c) => sum + c.totalSent, 0);
      const totalDelivered = data.reduce((sum, c) => sum + c.delivered, 0);
      const totalFailed = data.reduce((sum, c) => sum + c.failed, 0);
      const avgSuccess =
        totalSent > 0 ? `${((totalDelivered / totalSent) * 100).toFixed(1)}%` : "0%";

      setTotalStats({ totalSent, totalDelivered, totalFailed, avgSuccess });
    } catch {
      toast({
        title: "Could not load analytics",
        description: "Ensure your Analytics sheet tab is configured.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleExport = async (format: "csv" | "excel" | "pdf") => {
    setExporting(format);
    try {
      const res = await fetch(`/api/analytics/export?format=${format}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `hewane-campaigns.${format === "excel" ? "xlsx" : format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ title: "Export ready", description: `Downloaded ${format.toUpperCase()} file.` });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Performance insights"
        title="Analytics"
        description="Review campaign delivery, success rates, and export reports for your records."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              onClick={() => handleExport("csv")}
              disabled={Boolean(exporting)}
            >
              <Download className="mr-2 size-4" />
              {exporting === "csv" ? "Exporting…" : "CSV"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              onClick={() => handleExport("excel")}
              disabled={Boolean(exporting)}
            >
              <FileText className="mr-2 size-4" />
              Excel
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <StatCard
              label="Total sent"
              value={totalStats.totalSent}
              icon={<Send className="size-5 text-primary" />}
              iconClassName="bg-primary/10 text-primary"
            />
            <StatCard
              label="Delivered"
              value={totalStats.totalDelivered}
              icon={<CheckCircle2 className="size-5 text-emerald-700" />}
              iconClassName="bg-emerald-100 text-emerald-700"
              valueClassName="text-emerald-700"
            />
            <StatCard
              label="Failed"
              value={totalStats.totalFailed}
              icon={<XCircle className="size-5 text-red-600" />}
              iconClassName="bg-red-100 text-red-600"
              valueClassName="text-red-600"
            />
            <StatCard
              label="Avg success"
              value={totalStats.avgSuccess}
              icon={<TrendingUp className="size-5 text-[#7D3F7E]" />}
              iconClassName="bg-[#7D3F7E]/10 text-[#7D3F7E]"
              valueClassName="text-[#7D3F7E]"
            />
          </>
        )}
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Campaign history</CardTitle>
            <CardDescription>All broadcast campaigns logged from Google Sheets.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => handleExport("pdf")} disabled={Boolean(exporting)}>
            <FileText className="mr-2 size-4" />
            {exporting === "pdf" ? "Exporting…" : "Export PDF"}
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/80">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>Campaign</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Sent</TableHead>
                    <TableHead className="text-right">Delivered</TableHead>
                    <TableHead className="text-right">Failed</TableHead>
                    <TableHead className="text-right">Success</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.length > 0 ? (
                    campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="max-w-[200px] truncate font-medium">
                          {campaign.campaignName}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(campaign.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="muted" className="capitalize">
                            {campaign.contactGroup}
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
                        <p className="font-medium text-foreground">No campaigns yet</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Launch your first broadcast to see performance data here.
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

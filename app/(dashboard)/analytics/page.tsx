"use client";

import { useEffect, useState } from "react";
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
import { Download, FileText } from "lucide-react";

export default function AnalyticsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({
    totalSent: 0,
    totalDelivered: 0,
    totalFailed: 0,
    avgSuccess: "0%",
  });

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const data: Campaign[] = await res.json();
        setCampaigns(data);

        // Calculate totals
        const totalSent = data.reduce((sum, c) => sum + c.totalSent, 0);
        const totalDelivered = data.reduce((sum, c) => sum + c.delivered, 0);
        const totalFailed = data.reduce((sum, c) => sum + c.failed, 0);
        const avgSuccess =
          totalSent > 0 ? `${((totalDelivered / totalSent) * 100).toFixed(1)}%` : "0%";

        setTotalStats({
          totalSent,
          totalDelivered,
          totalFailed,
          avgSuccess,
        });
      }
    } catch (error) {
      console.error("[v0] Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: "csv" | "excel" | "pdf") => {
    try {
      const res = await fetch(`/api/analytics/export?format=${format}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `campaigns.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("[v0] Export error:", error);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-600 mt-2">Campaign performance and metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>
            <FileText className="w-4 h-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalSent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalStats.totalDelivered}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalStats.totalFailed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Success</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalStats.avgSuccess}</div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign History</CardTitle>
          <CardDescription>All broadcast campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-200 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Group</TableHead>
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
                        <TableCell className="font-medium">{campaign.campaignName}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(campaign.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm">{campaign.contactGroup}</TableCell>
                        <TableCell className="text-right">{campaign.totalSent}</TableCell>
                        <TableCell className="text-right text-green-600">
                          {campaign.delivered}
                        </TableCell>
                        <TableCell className="text-right text-red-600">{campaign.failed}</TableCell>
                        <TableCell className="text-right font-medium">
                          {campaign.successRate}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-600">
                        No campaigns yet
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

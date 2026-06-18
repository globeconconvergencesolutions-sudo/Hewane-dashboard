"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SEGMENTS, DELIVERY_SPEEDS } from "@/lib/constants";
import { Send, Pause, StopCircle } from "lucide-react";

export default function BroadcastPage() {
  const [campaignName, setCampaignName] = useState("");
  const [messageType, setMessageType] = useState<"template" | "custom">("template");
  const [messageBody, setMessageBody] = useState("");
  const [contactGroup, setContactGroup] = useState("all");
  const [deliverySpeed, setDeliverySpeed] = useState("Standard");
  const [emailFallback, setEmailFallback] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [startLoading, setStartLoading] = useState(false);

  const handleStartBroadcast = async () => {
    if (!campaignName || !messageBody) return;

    setStartLoading(true);
    try {
      const res = await fetch("/api/broadcast/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName,
          messageType,
          messageBody,
          contactGroup,
          deliverySpeed,
          emailFallback,
        }),
      });

      if (res.ok) {
        setIsActive(true);
        // Simulate progress polling
        const interval = setInterval(() => {
          setProgress((p) => (p < 90 ? p + Math.random() * 15 : p));
        }, 2000);

        setTimeout(() => {
          clearInterval(interval);
          setProgress(100);
          setIsActive(false);
        }, 15000);
      }
    } catch (error) {
      console.error("[v0] Broadcast error:", error);
    } finally {
      setStartLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Broadcast Campaign</h1>
        <p className="text-slate-600 mt-2">Start a new WhatsApp broadcast campaign</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Campaign Name *</label>
                <Input
                  placeholder="e.g., Holiday Updates"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  disabled={isActive}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Message Type</label>
                <div className="flex gap-4 mt-2">
                  {["template", "custom"].map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value={type}
                        checked={messageType === type}
                        onChange={(e) => setMessageType(e.target.value as any)}
                        disabled={isActive}
                      />
                      <span className="capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Message Body *</label>
                <textarea
                  className="w-full min-h-24 rounded-lg border border-input p-2 font-mono text-sm"
                  placeholder="Your message here..."
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  disabled={isActive}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Contact Group</label>
                <select
                  className="w-full rounded-lg border border-input p-2 text-sm"
                  value={contactGroup}
                  onChange={(e) => setContactGroup(e.target.value)}
                  disabled={isActive}
                >
                  <option value="all">All Contacts</option>
                  {SEGMENTS.map((seg) => (
                    <option key={seg} value={seg}>
                      {seg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Delivery Speed</label>
                <select
                  className="w-full rounded-lg border border-input p-2 text-sm"
                  value={deliverySpeed}
                  onChange={(e) => setDeliverySpeed(e.target.value)}
                  disabled={isActive}
                >
                  {DELIVERY_SPEEDS.map((speed) => (
                    <option key={speed.label} value={speed.label}>
                      {speed.label} ({speed.description})
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailFallback}
                  onChange={(e) => setEmailFallback(e.target.checked)}
                  disabled={isActive}
                />
                <span className="text-sm">Use email fallback if WhatsApp unavailable</span>
              </label>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleStartBroadcast}
                  disabled={isActive || startLoading || !campaignName || !messageBody}
                  className="flex-1"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {startLoading ? "Starting..." : "Start Broadcast"}
                </Button>
                {isActive && (
                  <>
                    <Button variant="outline" size="icon">
                      <Pause className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <StopCircle className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Campaign Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-2">Progress: {Math.round(progress)}%</div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {isActive ? (
                <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                  Broadcast in progress...
                </div>
              ) : progress > 0 ? (
                <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700">
                  Campaign completed!
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                  Ready to start a broadcast
                </div>
              )}

              <div className="pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Messages Sent:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Delivered:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Failed:</span>
                  <span className="font-medium">0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
